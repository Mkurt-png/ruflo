"""
Website quality analyzer.
Scores: mobile, SEO, speed, design, CTA, contact, booking, HTTPS.
Uses httpx for requests and BeautifulSoup for HTML parsing.
Optional: Playwright for screenshot capture.
"""

import asyncio
import re
import time
import logging
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from .models import WebsiteAnalysis

logger = logging.getLogger(__name__)

_TIMEOUT = 15
_MAX_REDIRECTS = 5


class WebsiteAnalyzer:

    async def analyze(self, url: str) -> WebsiteAnalysis:
        if not url:
            return WebsiteAnalysis(url="", reachable=False)

        url = _normalize_url(url)
        analysis = WebsiteAnalysis(url=url)

        try:
            async with httpx.AsyncClient(
                timeout=_TIMEOUT,
                follow_redirects=True,
                max_redirects=_MAX_REDIRECTS,
                headers={"User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)"},
            ) as client:
                t0 = time.monotonic()
                resp = await client.get(url)
                load_time = time.monotonic() - t0

            analysis.reachable = resp.status_code < 400
            analysis.has_https = str(resp.url).startswith("https://")

            if not analysis.reachable:
                analysis.issues.append(f"Site inaccessible (HTTP {resp.status_code})")
                return analysis

            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            _score_seo(analysis, soup, html)
            _score_mobile(analysis, html)
            _score_speed(analysis, html, load_time)
            _score_design(analysis, soup, html)
            _detect_features(analysis, soup, html)
            _build_recommendations(analysis)

        except httpx.ConnectError:
            analysis.issues.append("Impossible de joindre le site (DNS/connexion)")
        except httpx.TimeoutException:
            analysis.issues.append("Site trop lent à répondre (timeout > 15s)")
            analysis.speed_score = 1
        except Exception as exc:
            logger.warning("analyze(%s) error: %s", url, exc)
            analysis.issues.append(f"Erreur d'analyse: {exc}")

        return analysis

    async def screenshot(self, url: str, output_path: str) -> bool:
        """
        Capture a screenshot using Playwright (optional dependency).
        Returns True on success.
        """
        try:
            from playwright.async_api import async_playwright  # type: ignore
        except ImportError:
            logger.warning("Playwright not installed — screenshots disabled. Run: pip install playwright && playwright install chromium")
            return False

        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=True)
                page = await browser.new_page(viewport={"width": 1280, "height": 800})
                await page.goto(url, timeout=20000)
                await page.screenshot(path=output_path, full_page=False)
                await browser.close()
            logger.info("Screenshot saved: %s", output_path)
            return True
        except Exception as exc:
            logger.warning("Screenshot failed for %s: %s", url, exc)
            return False


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def _score_seo(a: WebsiteAnalysis, soup: BeautifulSoup, html: str) -> None:
    score = 10

    # Title
    title = soup.find("title")
    a.page_title = title.get_text(strip=True) if title else ""
    if not a.page_title:
        score -= 3
        a.issues.append("Pas de balise <title>")
    elif len(a.page_title) > 70:
        score -= 1
        a.issues.append("Titre trop long (>70 caractères)")

    # Meta description
    meta_desc = soup.find("meta", {"name": re.compile("description", re.I)})
    a.meta_description = meta_desc.get("content", "") if meta_desc else ""
    if not a.meta_description:
        score -= 2
        a.issues.append("Pas de meta description")

    # H1
    h1s = soup.find_all("h1")
    if not h1s:
        score -= 2
        a.issues.append("Aucun H1 sur la page")
    elif len(h1s) > 1:
        score -= 1
        a.issues.append(f"Plusieurs H1 ({len(h1s)}) — mauvais pour le SEO")

    # Images alt
    images = soup.find_all("img")
    images_without_alt = [img for img in images if not img.get("alt")]
    if images_without_alt:
        score -= 1
        a.issues.append(f"{len(images_without_alt)} image(s) sans attribut alt")

    # Schema markup
    if '"@context"' not in html and "itemscope" not in html:
        score -= 1
        a.issues.append("Pas de données structurées (Schema.org)")

    a.seo_score = max(0, min(10, score))


def _score_mobile(a: WebsiteAnalysis, html: str) -> None:
    score = 10

    if 'viewport' not in html:
        score -= 4
        a.issues.append("Pas de balise viewport — site non mobile-friendly")

    if 'media' not in html and '@media' not in html:
        score -= 3
        a.issues.append("Pas de CSS responsive détecté")

    # Font size hints
    if 'font-size: 1' not in html and 'font-size:1' not in html:
        pass  # can't reliably detect from HTML alone

    a.mobile_score = max(0, min(10, score))


def _score_speed(a: WebsiteAnalysis, html: str, load_time: float) -> None:
    score = 10

    if load_time > 5:
        score -= 4
        a.issues.append(f"Chargement très lent : {load_time:.1f}s (objectif < 3s)")
    elif load_time > 3:
        score -= 2
        a.issues.append(f"Chargement lent : {load_time:.1f}s")

    # Unminified resources
    render_blocking = html.count('<link rel="stylesheet"') + html.count('<script src=')
    if render_blocking > 10:
        score -= 2
        a.issues.append(f"Trop de ressources bloquantes ({render_blocking})")

    # Large inline scripts
    inline_scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', html, re.DOTALL)
    total_inline_kb = sum(len(s) for s in inline_scripts) / 1024
    if total_inline_kb > 100:
        score -= 1
        a.issues.append(f"Scripts inline volumineux ({total_inline_kb:.0f} KB)")

    a.speed_score = max(0, min(10, score))


def _score_design(a: WebsiteAnalysis, soup: BeautifulSoup, html: str) -> None:
    score = 7  # Start at 7; we can't fully assess visual design from HTML

    # Favicon
    favicon = soup.find("link", rel=re.compile("icon", re.I))
    if not favicon:
        score -= 1
        a.issues.append("Pas de favicon")

    # OG tags (social sharing = modern design practice)
    og_image = soup.find("meta", {"property": "og:image"})
    if not og_image:
        score -= 1
        a.issues.append("Pas d'image Open Graph (partage réseaux sociaux)")

    # Footer
    footer = soup.find("footer")
    if not footer:
        score -= 1
        a.issues.append("Pas de footer structuré détecté")

    a.design_score = max(0, min(10, score))


def _detect_features(a: WebsiteAnalysis, soup: BeautifulSoup, html: str) -> None:
    html_lower = html.lower()

    # Phone number
    phone_match = re.search(
        r'(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})', html
    )
    a.phone_number = phone_match.group(1) if phone_match else ""

    # HTTPS
    if not a.has_https:
        a.issues.append("Site sans HTTPS — bloqué par Chrome sur mobile")

    # CTA detection
    cta_patterns = [
        r'contactez[- ]nous', r'nous contacter', r'demande de soumission',
        r'prendre rendez-vous', r'réserver', r'appeler', r'call now',
        r'get a quote', r'book', r'schedule',
    ]
    a.has_cta = any(re.search(p, html_lower) for p in cta_patterns)
    if not a.has_cta:
        a.issues.append("Pas de CTA (call-to-action) clair visible")

    # Contact form
    forms = soup.find_all("form")
    a.has_contact_form = len(forms) > 0
    if not a.has_contact_form:
        a.issues.append("Pas de formulaire de contact")

    # Booking / reservation
    booking_keywords = ["calendly", "acuity", "opentable", "resy", "booksy", "squareup",
                        "réserver", "reservation", "rendez-vous", "appointment"]
    a.has_booking = any(kw in html_lower for kw in booking_keywords)

    # Analytics
    a.has_google_analytics = "google-analytics" in html_lower or "gtag(" in html_lower

    # Social links
    social_domains = ["facebook.com", "instagram.com", "linkedin.com", "twitter.com", "tiktok.com"]
    a.has_social_links = any(d in html_lower for d in social_domains)


def _build_recommendations(a: WebsiteAnalysis) -> None:
    recs = []

    if not a.has_https:
        recs.append("Activer HTTPS (SSL) — priorité absolue")
    if a.mobile_score < 6:
        recs.append("Rendre le site 100% mobile-friendly")
    if a.speed_score < 6:
        recs.append("Optimiser la vitesse (objectif < 3s)")
    if a.seo_score < 6:
        recs.append("Corriger les bases SEO (titre, meta, H1)")
    if not a.has_cta:
        recs.append("Ajouter un CTA clair et visible")
    if not a.has_contact_form:
        recs.append("Ajouter un formulaire de contact")
    if not a.has_booking:
        recs.append("Intégrer un système de réservation en ligne")
    if not a.has_social_links:
        recs.append("Lier les réseaux sociaux")

    a.recommendations = recs[:5]  # Top 5 max


def _normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url
