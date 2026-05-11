"""Data models for the automated outreach pipeline."""

from dataclasses import dataclass, field, asdict
from typing import Optional
from datetime import datetime
import json


@dataclass
class WebsiteAnalysis:
    url: str
    reachable: bool = False
    has_https: bool = False
    mobile_score: int = 0       # 0-10
    seo_score: int = 0          # 0-10
    speed_score: int = 0        # 0-10
    design_score: int = 0       # 0-10
    has_cta: bool = False
    has_contact_form: bool = False
    has_booking: bool = False
    has_google_analytics: bool = False
    has_social_links: bool = False
    page_title: str = ""
    meta_description: str = ""
    phone_number: str = ""
    issues: list = field(default_factory=list)
    recommendations: list = field(default_factory=list)

    @property
    def overall_score(self) -> int:
        if not self.reachable:
            return 0
        return round((self.mobile_score + self.seo_score + self.speed_score + self.design_score) / 4)

    @property
    def needs_redesign(self) -> bool:
        return self.overall_score < 6

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Lead:
    business_name: str
    category: str
    city: str
    address: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    google_maps_url: str = ""
    source: str = ""
    analysis: Optional[WebsiteAnalysis] = None
    outreach_email_subject: str = ""
    outreach_email_body: str = ""
    status: str = "new"           # new | analyzed | emailed | replied | won | lost
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    notes: str = ""

    @property
    def has_website(self) -> bool:
        return bool(self.website)

    @property
    def is_ready_to_email(self) -> bool:
        return bool(self.email or self.website) and bool(self.outreach_email_body)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["has_website"] = self.has_website
        d["overall_score"] = self.analysis.overall_score if self.analysis else None
        d["needs_redesign"] = self.analysis.needs_redesign if self.analysis else None
        return d

    def to_csv_row(self) -> dict:
        return {
            "business_name": self.business_name,
            "category": self.category,
            "city": self.city,
            "address": self.address,
            "phone": self.phone,
            "email": self.email,
            "website": self.website,
            "has_website": self.has_website,
            "overall_score": self.analysis.overall_score if self.analysis else "",
            "needs_redesign": self.analysis.needs_redesign if self.analysis else "",
            "mobile_score": self.analysis.mobile_score if self.analysis else "",
            "seo_score": self.analysis.seo_score if self.analysis else "",
            "issues": " | ".join(self.analysis.issues) if self.analysis else "",
            "email_subject": self.outreach_email_subject,
            "status": self.status,
            "created_at": self.created_at,
            "source": self.source,
        }


@dataclass
class NicheConfig:
    category: str               # "plombier", "dentiste", "resto", etc.
    keywords: list = field(default_factory=list)
    value_propositions: list = field(default_factory=list)  # key selling angles per niche
    example_improvements: list = field(default_factory=list)
    email_tone: str = "friendly"   # friendly | professional | urgent

    def to_dict(self) -> dict:
        return asdict(self)


# Pre-defined niche configs for common local business types
NICHE_CONFIGS = {
    "plombier": NicheConfig(
        category="plombier",
        keywords=["plombier", "plomberie", "débouchage", "urgence plomberie"],
        value_propositions=[
            "bouton d'urgence 24/7 visible dès l'arrivée sur le site",
            "formulaire de devis rapide en moins de 30 secondes",
            "avis Google affichés pour rassurer immédiatement",
        ],
        example_improvements=[
            "Ajouter un grand bouton 'Urgence 24/7' en rouge",
            "Formulaire simplifié : nom, problème, code postal",
            "Badge Google Reviews visible en haut de page",
        ],
        email_tone="urgent",
    ),
    "dentiste": NicheConfig(
        category="dentiste",
        keywords=["dentiste", "clinique dentaire", "orthodontiste", "blanchiment"],
        value_propositions=[
            "prise de rendez-vous en ligne directement",
            "section assurances acceptées clairement affichée",
            "avant/après sourires pour gagner la confiance",
        ],
        example_improvements=[
            "Bouton 'Prendre rendez-vous' dans le header",
            "Liste des assurances acceptées en page d'accueil",
            "Photos de l'équipe pour humaniser la clinique",
        ],
        email_tone="professional",
    ),
    "resto": NicheConfig(
        category="resto",
        keywords=["restaurant", "brasserie", "pizzeria", "sushi", "café"],
        value_propositions=[
            "menu consultable sur mobile sans télécharger de PDF",
            "réservation en 1 clic directement depuis Google",
            "photos plats en plein écran pour donner faim",
        ],
        example_improvements=[
            "Menu HTML mobile-friendly (plus de PDF)",
            "Intégration OpenTable ou Resy pour réservations",
            "Galerie photo professionnelle des plats",
        ],
        email_tone="friendly",
    ),
    "gym": NicheConfig(
        category="gym",
        keywords=["gym", "centre sportif", "CrossFit", "yoga", "pilates", "fitness"],
        value_propositions=[
            "offre d'essai gratuite bien mise en avant",
            "horaires toujours à jour et visibles",
            "témoignages transformations avant/après",
        ],
        example_improvements=[
            "CTA 'Essai gratuit 7 jours' en haut de page",
            "Section témoignages avec photos membres",
            "Calendrier des cours en ligne",
        ],
        email_tone="friendly",
    ),
    "salon_coiffure": NicheConfig(
        category="salon_coiffure",
        keywords=["coiffeur", "salon de coiffure", "barbier", "coloration"],
        value_propositions=[
            "réservation en ligne 24/7 sans appeler",
            "galerie coiffures pour inspirer les clients",
            "tarifs clairs affichés sans devoir appeler",
        ],
        example_improvements=[
            "Intégration Booksy ou Square Appointments",
            "Galerie Instagram intégrée",
            "Page tarifs claire et complète",
        ],
        email_tone="friendly",
    ),
    "avocat": NicheConfig(
        category="avocat",
        keywords=["avocat", "cabinet juridique", "notaire", "droit"],
        value_propositions=[
            "consultation gratuite mise en avant",
            "domaines de pratique clairement expliqués",
            "formulaire de contact confidentiel",
        ],
        example_improvements=[
            "Bouton 'Consultation gratuite' visible",
            "FAQ pour rassurer avant le contact",
            "Formulaire sécurisé et confidentiel",
        ],
        email_tone="professional",
    ),
    "courtier": NicheConfig(
        category="courtier",
        keywords=["courtier immobilier", "agent immobilier", "hypothèque"],
        value_propositions=[
            "calculateur de paiement hypothécaire interactif",
            "listings intégrés directement sur le site",
            "témoignages clients récents avec photos",
        ],
        example_improvements=[
            "Outil de calcul hypothécaire interactif",
            "Intégration MLS/Centris pour les listings",
            "Section témoignages avec Google Reviews",
        ],
        email_tone="professional",
    ),
    "garage": NicheConfig(
        category="garage",
        keywords=["garage auto", "mécanicien", "réparation auto", "pneus"],
        value_propositions=[
            "prise de rendez-vous en ligne pour éviter les appels",
            "liste de services avec prix approximatifs",
            "bouton d'urgence pour dépannage rapide",
        ],
        example_improvements=[
            "Formulaire de réservation en ligne simple",
            "Page services avec prix de base",
            "Badge Google Reviews en homepage",
        ],
        email_tone="friendly",
    ),
}
