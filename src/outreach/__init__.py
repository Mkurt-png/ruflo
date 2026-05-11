"""Automated outreach pipeline for local business web design prospecting."""

from .models import Lead, WebsiteAnalysis, NicheConfig, NICHE_CONFIGS
from .analyzer import WebsiteAnalyzer
from .scraper import BusinessScraper
from .generator import EmailGenerator
from .crm import LeadCRM
from .pipeline import OutreachPipeline, PipelineConfig

__all__ = [
    "Lead",
    "WebsiteAnalysis",
    "NicheConfig",
    "NICHE_CONFIGS",
    "WebsiteAnalyzer",
    "BusinessScraper",
    "EmailGenerator",
    "LeadCRM",
    "OutreachPipeline",
    "PipelineConfig",
]
