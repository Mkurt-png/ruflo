#!/usr/bin/env python3
"""
CLI entry point for the automated outreach pipeline.

Usage examples:
  python scripts/run_outreach.py run --category plombier --cities Montreal Victoriaville
  python scripts/run_outreach.py analyze --url https://example.com
  python scripts/run_outreach.py stats
  python scripts/run_outreach.py export
  python scripts/run_outreach.py niches
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Resolve project root so imports work regardless of cwd
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.outreach.models import NICHE_CONFIGS
from src.outreach.pipeline import OutreachPipeline, PipelineConfig
from src.outreach.crm import LeadCRM


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    # Suppress noisy libs
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def _load_config(config_path: str | None) -> dict:
    defaults = {
        "anthropic_api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
        "serpapi_key": os.environ.get("SERPAPI_KEY", ""),
        "data_dir": "./data/outreach",
        "max_leads_per_source": 20,
        "take_screenshots": False,
        "generate_emails": True,
        "analysis_concurrency": 5,
        "email_gen_concurrency": 3,
        "min_score_to_email": 0,
        "only_needs_redesign": False,
    }
    if config_path and Path(config_path).exists():
        with open(config_path) as f:
            overrides = json.load(f)
        defaults.update(overrides)
    return defaults


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

async def cmd_run(args: argparse.Namespace, cfg: dict) -> None:
    """Full pipeline: scrape → analyze → generate emails → save CRM."""
    if not args.category:
        print("ERROR: --category is required. Example: --category plombier")
        sys.exit(1)
    if not args.cities:
        print("ERROR: --cities is required. Example: --cities Montreal Victoriaville")
        sys.exit(1)

    if not cfg["anthropic_api_key"] and not args.dry_run:
        print("WARNING: ANTHROPIC_API_KEY not set. Email generation will be skipped.")
        print("         Set it via: export ANTHROPIC_API_KEY=sk-ant-...")

    config = PipelineConfig(
        anthropic_api_key=cfg["anthropic_api_key"],
        serpapi_key=cfg["serpapi_key"],
        data_dir=cfg["data_dir"],
        max_leads_per_source=cfg["max_leads_per_source"],
        take_screenshots=cfg.get("take_screenshots", False),
        generate_emails=cfg["generate_emails"] and not args.dry_run,
        analysis_concurrency=cfg["analysis_concurrency"],
        email_gen_concurrency=cfg["email_gen_concurrency"],
        min_score_to_email=cfg["min_score_to_email"],
        only_needs_redesign=args.needs_redesign or cfg["only_needs_redesign"],
    )

    pipeline = OutreachPipeline(config)
    leads = await pipeline.run(
        category=args.category,
        cities=args.cities,
        dry_run=args.dry_run,
    )

    if args.show_emails:
        print("\n=== EMAILS GÉNÉRÉS ===")
        for lead in leads:
            if lead.outreach_email_body:
                print(f"\n--- {lead.business_name} ({lead.city}) ---")
                print(f"Sujet : {lead.outreach_email_subject}")
                print(f"\n{lead.outreach_email_body}\n")


async def cmd_analyze(args: argparse.Namespace, cfg: dict) -> None:
    """Quick analysis of a single URL."""
    from src.outreach.analyzer import WebsiteAnalyzer
    analyzer = WebsiteAnalyzer()
    await OutreachPipeline(PipelineConfig()).analyze_single(args.url)


async def cmd_stats(args: argparse.Namespace, cfg: dict) -> None:
    """Show CRM stats."""
    crm = LeadCRM(cfg["data_dir"])
    stats = crm.stats
    print(f"\n{'='*45}")
    print("STATISTIQUES CRM")
    print(f"{'='*45}")
    print(f"  Total leads            : {stats['total']}")
    print(f"  Avec site web          : {stats['with_website']}")
    print(f"  Sans site web          : {stats['without_website']}")
    print(f"  Nécessitent redesign   : {stats['needs_redesign']}")
    print(f"  Score moyen            : {stats['avg_site_score']}/10")
    print(f"\n  Par statut:")
    for status, count in stats.get("by_status", {}).items():
        print(f"    {status:<20} : {count}")
    print(f"{'='*45}\n")


async def cmd_export(args: argparse.Namespace, cfg: dict) -> None:
    """Export CRM to CSV."""
    crm = LeadCRM(cfg["data_dir"])
    out = crm.export_csv(args.output)
    print(f"Exported {crm.stats['total']} leads → {out}")


async def cmd_niches(args: argparse.Namespace, cfg: dict) -> None:
    """List available niche configs."""
    print("\nNiches disponibles:")
    print(f"{'='*50}")
    for key, niche in NICHE_CONFIGS.items():
        print(f"\n  {key}")
        print(f"    Mots-clés      : {', '.join(niche.keywords[:3])}")
        print(f"    Angle principal: {niche.value_propositions[0]}")
        print(f"    Ton            : {niche.email_tone}")
    print(f"\n{'='*50}")
    print(f"Total : {len(NICHE_CONFIGS)} niches configurées\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="outreach",
        description="Pipeline de prospection automatisée pour agence web locale",
    )
    parser.add_argument("--config", help="Path to config JSON file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Debug logging")

    sub = parser.add_subparsers(dest="command", required=True)

    # run
    run_p = sub.add_parser("run", help="Lancer le pipeline complet")
    run_p.add_argument("--category", "-c", required=True, help="Catégorie (ex: plombier)")
    run_p.add_argument("--cities", "-l", nargs="+", required=True, help="Villes cibles")
    run_p.add_argument("--dry-run", action="store_true", help="Analyser sans générer d'emails")
    run_p.add_argument("--needs-redesign", action="store_true", help="Contacter seulement les sites qui ont besoin d'un redesign")
    run_p.add_argument("--show-emails", action="store_true", help="Afficher les emails générés")

    # analyze
    ana_p = sub.add_parser("analyze", help="Analyser un seul site web")
    ana_p.add_argument("--url", "-u", required=True, help="URL à analyser")

    # stats
    sub.add_parser("stats", help="Afficher les stats du CRM")

    # export
    exp_p = sub.add_parser("export", help="Exporter le CRM en CSV")
    exp_p.add_argument("--output", "-o", help="Chemin du fichier CSV de sortie")

    # niches
    sub.add_parser("niches", help="Lister les niches disponibles")

    args = parser.parse_args()
    _setup_logging(args.verbose)
    cfg = _load_config(args.config)

    commands = {
        "run": cmd_run,
        "analyze": cmd_analyze,
        "stats": cmd_stats,
        "export": cmd_export,
        "niches": cmd_niches,
    }

    asyncio.run(commands[args.command](args, cfg))


if __name__ == "__main__":
    main()
