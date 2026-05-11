"""
Business discovery scraper.
Supports: Google Maps (via SerpAPI), Pages Jaunes, Yelp CA.
All network calls are async-ready and rate-limited.
"""

import asyncio
import json
import re
import time
import urllib.parse
from typing import Optional
import logging

import httpx
from bs4 import BeautifulSoup

from .models import Lead

logger = logging.getLogger(__name__)

# Polite delay between requests (seconds)
_REQUEST_DELAY = 2.0


class ScraperError(Exception):
    pass


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return raw.strip()


def _extract_domain(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    return parsed.netloc.lstrip("www.")


# ---------------------------------------------------------------------------
# Google Maps via SerpAPI
# ---------------------------------------------------------------------------

class GoogleMapsScraper:
    """Finds businesses via SerpAPI Google Maps endpoint."""

    BASE_URL = "https://serpapi.com/search"

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def search(
        self,
        query: str,
        city: str,
        max_results: int = 20,
    ) -> list[Lead]:
        leads: list[Lead] = []
        params = {
            "engine": "google_maps",
            "q": f"{query} {city}",
            "type": "search",
            "api_key": self.api_key,
            "hl": "fr",
            "gl": "ca",
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(self.BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        for place in data.get("local_results", [])[:max_results]:
            lead = Lead(
                business_name=place.get("title", ""),
                category=query,
                city=city,
                address=place.get("address", ""),
                phone=_normalize_phone(place.get("phone", "")),
                website=place.get("website", ""),
                google_maps_url=place.get("link", ""),
                source="google_maps",
            )
            if lead.business_name:
                leads.append(lead)

        logger.info("Google Maps: found %d leads for '%s' in %s", len(leads), query, city)
        return leads


# ---------------------------------------------------------------------------
# Pages Jaunes (Canada) scraper
# ---------------------------------------------------------------------------

class PagesJaunesScraper:
    """Scrapes pagesjaunes.ca for local business listings."""

    BASE_URL = "https://www.pagesjaunes.ca/search/si/1/{query}/{city}"
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "fr-CA,fr;q=0.9",
    }

    async def search(
        self,
        query: str,
        city: str,
        max_results: int = 20,
    ) -> list[Lead]:
        encoded_query = urllib.parse.quote_plus(query)
        encoded_city = urllib.parse.quote_plus(city)
        url = self.BASE_URL.format(query=encoded_query, city=encoded_city)
        leads: list[Lead] = []

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url, headers=self.HEADERS)
            if resp.status_code != 200:
                logger.warning("Pages Jaunes returned %d for %s / %s", resp.status_code, query, city)
                return leads

        soup = BeautifulSoup(resp.text, "html.parser")
        listings = soup.select(".result-with-gallery, .yp-biz-listing, article.listing")[:max_results]

        for listing in listings:
            name_el = listing.select_one("h3.listing-name a, .business-name a, h2 a")
            if not name_el:
                continue

            phone_el = listing.select_one(".phone-number, [class*='phone']")
            address_el = listing.select_one(".address, [class*='address']")
            website_el = listing.select_one("a.website-link, a[href*='http']:not([href*='pagesjaunes'])")

            lead = Lead(
                business_name=name_el.get_text(strip=True),
                category=query,
                city=city,
                address=address_el.get_text(strip=True) if address_el else "",
                phone=_normalize_phone(phone_el.get_text(strip=True)) if phone_el else "",
                website=website_el["href"] if website_el and website_el.get("href") else "",
                source="pages_jaunes",
            )
            leads.append(lead)
            await asyncio.sleep(0.1)

        logger.info("Pages Jaunes: found %d leads for '%s' in %s", len(leads), query, city)
        return leads


# ---------------------------------------------------------------------------
# Yelp Canada scraper (HTML, no API key needed)
# ---------------------------------------------------------------------------

class YelpScraper:
    """Scrapes yelp.ca for local business listings."""

    BASE_URL = "https://www.yelp.ca/search"
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        ),
        "Accept-Language": "fr-CA,fr;q=0.9",
    }

    async def search(
        self,
        query: str,
        city: str,
        max_results: int = 20,
    ) -> list[Lead]:
        params = {"find_desc": query, "find_loc": f"{city}, QC"}
        leads: list[Lead] = []

        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(self.BASE_URL, params=params, headers=self.HEADERS)
            if resp.status_code != 200:
                logger.warning("Yelp returned %d for %s / %s", resp.status_code, query, city)
                return leads

        soup = BeautifulSoup(resp.text, "html.parser")

        # Yelp embeds data in a JSON script tag
        scripts = soup.find_all("script", {"type": "application/json"})
        for script in scripts:
            try:
                data = json.loads(script.string or "")
                businesses = _extract_yelp_businesses(data)
                if businesses:
                    for biz in businesses[:max_results]:
                        leads.append(Lead(
                            business_name=biz.get("name", ""),
                            category=query,
                            city=city,
                            address=biz.get("address", ""),
                            phone=_normalize_phone(biz.get("phone", "")),
                            website=biz.get("website", ""),
                            source="yelp",
                        ))
                    break
            except (json.JSONDecodeError, TypeError):
                continue

        logger.info("Yelp: found %d leads for '%s' in %s", len(leads), query, city)
        return leads


def _extract_yelp_businesses(data: dict | list, depth: int = 0) -> list[dict]:
    """Recursively search JSON for Yelp business objects."""
    if depth > 8:
        return []
    results = []
    if isinstance(data, dict):
        if "name" in data and "businessUrl" in data:
            results.append({
                "name": data.get("name", ""),
                "address": data.get("formattedAddress", ""),
                "phone": data.get("phone", ""),
                "website": data.get("businessUrl", ""),
            })
        for v in data.values():
            results.extend(_extract_yelp_businesses(v, depth + 1))
    elif isinstance(data, list):
        for item in data:
            results.extend(_extract_yelp_businesses(item, depth + 1))
    return results


# ---------------------------------------------------------------------------
# Unified scraper facade
# ---------------------------------------------------------------------------

class BusinessScraper:
    """
    Aggregates multiple scrapers. Falls back gracefully when a source fails.
    """

    def __init__(self, serpapi_key: Optional[str] = None):
        self.serpapi_key = serpapi_key
        self._pj = PagesJaunesScraper()
        self._yelp = YelpScraper()
        self._gmaps = GoogleMapsScraper(serpapi_key) if serpapi_key else None

    async def find_businesses(
        self,
        category: str,
        city: str,
        max_per_source: int = 20,
        sources: Optional[list[str]] = None,
    ) -> list[Lead]:
        """
        Search multiple sources and deduplicate by business name.
        sources: subset of ["google_maps", "pages_jaunes", "yelp"] or None for all.
        """
        if sources is None:
            sources = ["google_maps", "pages_jaunes", "yelp"]

        tasks = []
        if "google_maps" in sources and self._gmaps:
            tasks.append(self._safe_search(self._gmaps, category, city, max_per_source))
        if "pages_jaunes" in sources:
            tasks.append(self._safe_search(self._pj, category, city, max_per_source))
        if "yelp" in sources:
            tasks.append(self._safe_search(self._yelp, category, city, max_per_source))

        results = await asyncio.gather(*tasks)
        all_leads = [lead for batch in results for lead in batch]

        # Deduplicate by normalized business name
        seen: set[str] = set()
        unique_leads: list[Lead] = []
        for lead in all_leads:
            key = re.sub(r"\W+", "", lead.business_name.lower())
            if key not in seen:
                seen.add(key)
                unique_leads.append(lead)

        logger.info("Total unique leads: %d for '%s' in %s", len(unique_leads), category, city)
        return unique_leads

    async def _safe_search(self, scraper, query: str, city: str, max_results: int) -> list[Lead]:
        try:
            await asyncio.sleep(_REQUEST_DELAY)
            return await scraper.search(query, city, max_results)
        except Exception as exc:
            logger.warning("%s failed: %s", type(scraper).__name__, exc)
            return []
