"""
Lightweight CRM — CSV + JSON storage for leads.
No external dependencies. Works offline. Exportable to Airtable/Notion.
"""

import csv
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from .models import Lead

logger = logging.getLogger(__name__)

_CSV_FIELDNAMES = [
    "business_name", "category", "city", "address", "phone", "email",
    "website", "has_website", "overall_score", "needs_redesign",
    "mobile_score", "seo_score", "issues", "email_subject", "status",
    "created_at", "source",
]


class LeadCRM:
    """
    Stores leads in:
    - leads.csv  — flat export, easy to open in Excel/Sheets
    - leads.json — full structured data with analysis
    """

    def __init__(self, data_dir: str = "./data/outreach"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.csv_path = self.data_dir / "leads.csv"
        self.json_path = self.data_dir / "leads.json"
        self._leads: list[Lead] = []
        self._load_existing()

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------

    def add(self, lead: Lead) -> None:
        existing = self._find_by_name_city(lead.business_name, lead.city)
        if existing:
            # Update in place
            idx = self._leads.index(existing)
            lead.created_at = existing.created_at
            lead.updated_at = datetime.now().isoformat()
            self._leads[idx] = lead
            logger.debug("Updated existing lead: %s", lead.business_name)
        else:
            self._leads.append(lead)
            logger.debug("Added new lead: %s", lead.business_name)

    def add_many(self, leads: list[Lead]) -> None:
        for lead in leads:
            self.add(lead)

    def update_status(self, business_name: str, city: str, status: str, notes: str = "") -> bool:
        lead = self._find_by_name_city(business_name, city)
        if not lead:
            return False
        lead.status = status
        lead.updated_at = datetime.now().isoformat()
        if notes:
            lead.notes = notes
        return True

    def get_by_status(self, status: str) -> list[Lead]:
        return [l for l in self._leads if l.status == status]

    def get_ready_to_email(self) -> list[Lead]:
        return [l for l in self._leads if l.is_ready_to_email and l.status in ("analyzed",)]

    def get_needs_follow_up(self, days: int = 3) -> list[Lead]:
        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        return [
            l for l in self._leads
            if l.status == "emailed" and l.updated_at < cutoff
        ]

    @property
    def stats(self) -> dict:
        total = len(self._leads)
        with_website = sum(1 for l in self._leads if l.has_website)
        needs_redesign = sum(1 for l in self._leads if l.analysis and l.analysis.needs_redesign)
        by_status = {}
        for l in self._leads:
            by_status[l.status] = by_status.get(l.status, 0) + 1
        avg_score = (
            sum(l.analysis.overall_score for l in self._leads if l.analysis and l.analysis.reachable)
            / max(1, sum(1 for l in self._leads if l.analysis and l.analysis.reachable))
        )
        return {
            "total": total,
            "with_website": with_website,
            "without_website": total - with_website,
            "needs_redesign": needs_redesign,
            "avg_site_score": round(avg_score, 1),
            "by_status": by_status,
        }

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self) -> None:
        self._save_csv()
        self._save_json()
        logger.info("CRM saved: %d leads → %s", len(self._leads), self.data_dir)

    def _save_csv(self) -> None:
        with open(self.csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=_CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            for lead in self._leads:
                writer.writerow(lead.to_csv_row())

    def _save_json(self) -> None:
        data = [lead.to_dict() for lead in self._leads]
        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    def _load_existing(self) -> None:
        if not self.json_path.exists():
            return
        try:
            with open(self.json_path, encoding="utf-8") as f:
                raw = json.load(f)
            for item in raw:
                lead = _lead_from_dict(item)
                self._leads.append(lead)
            logger.info("CRM loaded: %d existing leads", len(self._leads))
        except (json.JSONDecodeError, KeyError) as exc:
            logger.warning("Could not load existing leads: %s", exc)

    def export_csv(self, path: Optional[str] = None) -> str:
        out = Path(path) if path else self.data_dir / f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=_CSV_FIELDNAMES, extrasaction="ignore")
            writer.writeheader()
            for lead in self._leads:
                writer.writerow(lead.to_csv_row())
        return str(out)

    def _find_by_name_city(self, name: str, city: str) -> Optional[Lead]:
        name_lower = name.lower().strip()
        city_lower = city.lower().strip()
        for lead in self._leads:
            if lead.business_name.lower().strip() == name_lower and lead.city.lower().strip() == city_lower:
                return lead
        return None


# ---------------------------------------------------------------------------
# Deserialization helper
# ---------------------------------------------------------------------------

def _lead_from_dict(d: dict) -> Lead:
    from .models import WebsiteAnalysis
    analysis_data = d.pop("analysis", None)
    # Remove computed properties that aren't constructor args
    for key in ("has_website", "overall_score", "needs_redesign"):
        d.pop(key, None)

    lead = Lead(**{k: v for k, v in d.items() if k in Lead.__dataclass_fields__})

    if analysis_data and isinstance(analysis_data, dict):
        lead.analysis = WebsiteAnalysis(
            **{k: v for k, v in analysis_data.items() if k in WebsiteAnalysis.__dataclass_fields__}
        )
    return lead
