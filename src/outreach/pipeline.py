"""
Main pipeline orchestrator.

Flow:
  1. Scrape businesses  →  2. Analyze websites  →  3. Generate emails
  →  4. Save to CRM  →  5. (optional) Send emails

Usage:
  pipeline = OutreachPipeline(config)
  await pipeline.run(category="plombier", cities=["Montréal", "Victoriaville"])
"""

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Optional

from .analyzer import WebsiteAnalyzer
from .crm import LeadCRM
from .generator import EmailGenerator
from .models import Lead
from .scraper import BusinessScraper

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    # API keys
    anthropic_api_key: str = ""
    serpapi_key: str = ""

    # Scraping
    max_leads_per_source: int = 20
    sources: list = None  # None = all available

    # Analysis
    take_screenshots: bool = False
    screenshots_dir: str = "./data/outreach/screenshots"

    # Generation
    generate_emails: bool = True
    generate_audit: bool = True

    # CRM
    data_dir: str = "./data/outreach"

    # Rate limiting
    analysis_concurrency: int = 5   # max parallel website analyses
    email_gen_concurrency: int = 3  # max parallel Claude calls

    # Filtering
    min_score_to_email: int = 0     # 0 = email everyone including no-website
    only_needs_redesign: bool = False

    def __post_init__(self):
        if self.sources is None:
            self.sources = ["pages_jaunes", "yelp"]
            if self.serpapi_key:
                self.sources.insert(0, "google_maps")


class OutreachPipeline:

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.crm = LeadCRM(config.data_dir)
        self.scraper = BusinessScraper(serpapi_key=config.serpapi_key or None)
        self.analyzer = WebsiteAnalyzer()
        self.generator = (
            EmailGenerator(config.anthropic_api_key)
            if config.anthropic_api_key and config.generate_emails
            else None
        )

    async def run(
        self,
        category: str,
        cities: list[str],
        dry_run: bool = False,
    ) -> list[Lead]:
        """
        Full pipeline run. Returns processed leads.
        dry_run=True skips email generation (analyze only).
        """
        logger.info("=== Pipeline start: %s in %s ===", category, cities)

        # Step 1: Scrape
        all_leads = await self._step_scrape(category, cities)
        if not all_leads:
            logger.warning("No leads found. Check scraper config.")
            return []

        # Step 2: Analyze websites
        analyzed = await self._step_analyze(all_leads)

        # Step 3: Filter
        to_contact = self._filter_leads(analyzed)
        logger.info("Leads to contact: %d / %d", len(to_contact), len(analyzed))

        # Step 4: Generate emails
        if not dry_run and self.generator:
            await self._step_generate(to_contact)

        # Step 5: Save
        self.crm.add_many(analyzed)
        self.crm.save()

        stats = self.crm.stats
        logger.info(
            "=== Done. Total: %d | With website: %d | Needs redesign: %d | Avg score: %s/10 ===",
            stats["total"], stats["with_website"], stats["needs_redesign"], stats["avg_site_score"],
        )
        _print_summary(analyzed, to_contact)
        return analyzed

    # ------------------------------------------------------------------
    # Steps
    # ------------------------------------------------------------------

    async def _step_scrape(self, category: str, cities: list[str]) -> list[Lead]:
        tasks = [
            self.scraper.find_businesses(
                category=category,
                city=city,
                max_per_source=self.config.max_leads_per_source,
                sources=self.config.sources,
            )
            for city in cities
        ]
        results = await asyncio.gather(*tasks)
        leads = [lead for batch in results for lead in batch]
        logger.info("Scraped %d total leads", len(leads))
        return leads

    async def _step_analyze(self, leads: list[Lead]) -> list[Lead]:
        sem = asyncio.Semaphore(self.config.analysis_concurrency)

        async def _analyze_one(lead: Lead) -> Lead:
            async with sem:
                if lead.website:
                    lead.analysis = await self.analyzer.analyze(lead.website)
                    lead.status = "analyzed"

                    if self.config.take_screenshots and lead.analysis.reachable:
                        import os
                        os.makedirs(self.config.screenshots_dir, exist_ok=True)
                        safe_name = "".join(c if c.isalnum() else "_" for c in lead.business_name)
                        path = f"{self.config.screenshots_dir}/{safe_name}.png"
                        await self.analyzer.screenshot(lead.website, path)
                else:
                    lead.status = "no_website"
            return lead

        results = await asyncio.gather(*[_analyze_one(l) for l in leads])
        reachable = sum(1 for l in results if l.analysis and l.analysis.reachable)
        logger.info("Analyzed: %d reachable / %d total", reachable, len(results))
        return list(results)

    async def _step_generate(self, leads: list[Lead]) -> None:
        sem = asyncio.Semaphore(self.config.email_gen_concurrency)

        async def _gen_one(lead: Lead) -> None:
            async with sem:
                try:
                    subject, body = await asyncio.to_thread(
                        self.generator.generate_email, lead
                    )
                    lead.outreach_email_subject = subject
                    lead.outreach_email_body = body
                    logger.debug("Email generated for: %s", lead.business_name)
                except Exception as exc:
                    logger.warning("Email generation failed for %s: %s", lead.business_name, exc)

        await asyncio.gather(*[_gen_one(l) for l in leads])
        generated = sum(1 for l in leads if l.outreach_email_body)
        logger.info("Emails generated: %d / %d", generated, len(leads))

    def _filter_leads(self, leads: list[Lead]) -> list[Lead]:
        filtered = []
        for lead in leads:
            if self.config.only_needs_redesign:
                if lead.analysis and not lead.analysis.needs_redesign:
                    continue
            score = lead.analysis.overall_score if lead.analysis else 0
            if score >= self.config.min_score_to_email or not lead.has_website:
                filtered.append(lead)
        return filtered

    # ------------------------------------------------------------------
    # Convenience methods
    # ------------------------------------------------------------------

    async def analyze_single(self, url: str) -> None:
        """Quick analysis of a single URL — useful for testing."""
        analysis = await self.analyzer.analyze(url)
        print(f"\n{'='*50}")
        print(f"URL : {url}")
        print(f"Score global : {analysis.overall_score}/10")
        print(f"Mobile : {analysis.mobile_score}/10 | SEO : {analysis.seo_score}/10 | Vitesse : {analysis.speed_score}/10")
        print(f"HTTPS : {'✓' if analysis.has_https else '✗'} | CTA : {'✓' if analysis.has_cta else '✗'} | Formulaire : {'✓' if analysis.has_contact_form else '✗'}")
        print(f"\nProblèmes détectés ({len(analysis.issues)}):")
        for issue in analysis.issues:
            print(f"  ✗ {issue}")
        print(f"\nRecommandations:")
        for rec in analysis.recommendations:
            print(f"  → {rec}")
        print(f"{'='*50}\n")

    def print_crm_stats(self) -> None:
        stats = self.crm.stats
        print(f"\n{'='*40}")
        print("CRM Stats")
        print(f"{'='*40}")
        for k, v in stats.items():
            print(f"  {k}: {v}")
        print(f"{'='*40}\n")


def _print_summary(all_leads: list[Lead], to_contact: list[Lead]) -> None:
    print(f"\n{'='*60}")
    print("RÉSUMÉ DU PIPELINE")
    print(f"{'='*60}")
    print(f"  Leads trouvés     : {len(all_leads)}")
    print(f"  Avec site web     : {sum(1 for l in all_leads if l.has_website)}")
    print(f"  Sans site web     : {sum(1 for l in all_leads if not l.has_website)}")
    print(f"  Prêts à contacter : {len(to_contact)}")

    with_emails = sum(1 for l in to_contact if l.outreach_email_body)
    if with_emails:
        print(f"  Emails générés    : {with_emails}")

    print(f"\nTop leads (score le plus bas = plus grande opportunité):")
    sorted_leads = sorted(
        [l for l in to_contact if l.analysis],
        key=lambda l: l.analysis.overall_score,
    )[:5]
    for lead in sorted_leads:
        score = lead.analysis.overall_score
        bar = "█" * score + "░" * (10 - score)
        print(f"  [{bar}] {score}/10  {lead.business_name} ({lead.city})")
        if lead.outreach_email_subject:
            print(f"         Sujet : {lead.outreach_email_subject}")
    print(f"{'='*60}\n")
