"""
Claude-powered email and audit generator.
Produces hyper-personalized cold emails based on real website analysis.
Uses prompt caching for efficiency.
"""

import json
import logging
from typing import Optional

import anthropic

from .models import Lead, WebsiteAnalysis, NicheConfig, NICHE_CONFIGS

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-6"

# ---------------------------------------------------------------------------
# System prompt (cached — sent once, reused across all leads)
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """Tu es un expert en web design et SEO local qui aide les petites entreprises québécoises à attirer plus de clients en ligne.

Tu rédiges des emails de prospection ultra-personnalisés, courts et humains. Tes emails :
- Sont en français québécois naturel (pas trop formel, pas trop familier)
- Montrent que tu as vraiment regardé leur site (détails spécifiques)
- Proposent 1-2 améliorations concrètes et précises (pas génériques)
- N'utilisent JAMAIS le mot "IA" ni "automatisé"
- Ne sonnent JAMAIS comme du spam ou du cold email générique
- Sont courts : 4-6 phrases max pour le corps
- Se terminent par une question ouverte simple
- Incluent une preuve de ton travail (référence au portfolio)

Ton portfolio : https://rama-barbier.vercel.app

Règles absolues :
- JAMAIS "Je peux vous faire un site web"
- JAMAIS de liste à puces dans l'email
- JAMAIS de phrases génériques comme "J'ai remarqué que votre site..."
- TOUJOURS mentionner un détail spécifique du site analysé
- TOUJOURS proposer une action concrète visible (ex: bouton, formulaire)
"""

_AUDIT_SYSTEM = """Tu es un consultant web qui rédige des mini-audits en français québécois, clairs et professionnels.
L'audit doit être lisible par un propriétaire d'entreprise non-technique.
Présente les problèmes comme des opportunités manquées, pas comme des échecs.
"""


class EmailGenerator:

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)

    def generate_email(self, lead: Lead) -> tuple[str, str]:
        """
        Returns (subject, body) for a cold outreach email.
        Uses prompt caching on the system prompt.
        """
        analysis = lead.analysis
        niche = NICHE_CONFIGS.get(lead.category.lower().replace(" ", "_"), None)
        context = _build_context(lead, analysis, niche)

        messages = [
            {
                "role": "user",
                "content": f"""Rédige un email de prospection pour cette entreprise.

CONTEXTE:
{context}

FORMAT DE RÉPONSE (JSON uniquement, sans markdown):
{{
  "subject": "...",
  "body": "..."
}}

L'email doit mentionner AU MOINS UN problème spécifique trouvé sur leur site.
Le sujet doit être intriguant, court (max 8 mots), et spécifique à leur business.
Le corps doit faire 4-5 phrases max.""",
            }
        ]

        try:
            response = self.client.messages.create(
                model=_MODEL,
                max_tokens=600,
                system=[
                    {
                        "type": "text",
                        "text": _SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=messages,
            )
            raw = response.content[0].text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            return data.get("subject", ""), data.get("body", "")

        except json.JSONDecodeError as exc:
            logger.warning("JSON parse error in email generation: %s", exc)
            # Fallback: try to extract subject/body from plain text
            return _fallback_parse(raw if "raw" in dir() else "")
        except anthropic.APIError as exc:
            logger.error("Claude API error: %s", exc)
            raise

    def generate_audit_summary(self, lead: Lead) -> str:
        """
        Generates a short human-readable audit summary (3-5 bullet points).
        Suitable for including in the email or a PDF attachment.
        """
        if not lead.analysis:
            return ""

        a = lead.analysis
        issues_text = "\n".join(f"- {issue}" for issue in a.issues[:6]) if a.issues else "- Aucun problème majeur détecté"
        recs_text = "\n".join(f"- {r}" for r in a.recommendations[:4]) if a.recommendations else ""

        messages = [
            {
                "role": "user",
                "content": f"""Voici les résultats de l'analyse du site de {lead.business_name} ({lead.category} à {lead.city}):

Score global : {a.overall_score}/10
Score mobile : {a.mobile_score}/10
Score SEO : {a.seo_score}/10
Score vitesse : {a.speed_score}/10

Problèmes détectés :
{issues_text}

Recommandations :
{recs_text}

Rédige un mini-audit en 3-4 points, comme si tu l'écrivais pour le propriétaire de l'entreprise.
Commence par le plus urgent. Sois direct et concret. En français québécois naturel.""",
            }
        ]

        try:
            response = self.client.messages.create(
                model=_MODEL,
                max_tokens=400,
                system=[
                    {
                        "type": "text",
                        "text": _AUDIT_SYSTEM,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=messages,
            )
            return response.content[0].text.strip()
        except anthropic.APIError as exc:
            logger.error("Claude API error (audit): %s", exc)
            return ""

    def generate_follow_up(self, lead: Lead, days_since_first: int = 3) -> tuple[str, str]:
        """
        Generates a follow-up email for leads that haven't responded.
        """
        context = f"""
Entreprise : {lead.business_name} ({lead.category}, {lead.city})
Premier email envoyé il y a {days_since_first} jours
Sujet original : {lead.outreach_email_subject}
"""
        messages = [
            {
                "role": "user",
                "content": f"""Rédige un email de relance court et poli.

{context}

Règles :
- Maximum 3 phrases
- Ajouter un élément de valeur (ex: stat, exemple concret)
- Ne pas être insistant
- Proposer une alternative si pas intéressé (ex: "ou si ce n'est pas le bon moment...")

FORMAT JSON: {{"subject": "...", "body": "..."}}""",
            }
        ]

        try:
            response = self.client.messages.create(
                model=_MODEL,
                max_tokens=300,
                system=[{"type": "text", "text": _SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
                messages=messages,
            )
            raw = response.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw)
            return data.get("subject", ""), data.get("body", "")
        except Exception as exc:
            logger.error("Follow-up generation failed: %s", exc)
            return f"Re: {lead.outreach_email_subject}", ""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_context(lead: Lead, analysis: Optional[WebsiteAnalysis], niche: Optional[NicheConfig]) -> str:
    lines = [
        f"Entreprise : {lead.business_name}",
        f"Type : {lead.category}",
        f"Ville : {lead.city}",
    ]

    if lead.website:
        lines.append(f"Site web : {lead.website}")
    else:
        lines.append("Site web : AUCUN (opportunité directe)")

    if analysis and analysis.reachable:
        lines += [
            f"Score global site : {analysis.overall_score}/10",
            f"Score mobile : {analysis.mobile_score}/10",
            f"Score SEO : {analysis.seo_score}/10",
            f"Score vitesse : {analysis.speed_score}/10",
            f"HTTPS : {'Oui' if analysis.has_https else 'NON (problème!)'}",
            f"CTA visible : {'Oui' if analysis.has_cta else 'Non'}",
            f"Formulaire de contact : {'Oui' if analysis.has_contact_form else 'Non'}",
            f"Réservation en ligne : {'Oui' if analysis.has_booking else 'Non'}",
        ]
        if analysis.issues:
            lines.append("Problèmes détectés : " + " | ".join(analysis.issues[:4]))
        if analysis.page_title:
            lines.append(f"Titre de la page : {analysis.page_title}")
    elif analysis and not analysis.reachable:
        lines.append("Site web : INACCESSIBLE (grosse opportunité)")
    else:
        lines.append("Site web : Non analysé")

    if niche:
        lines.append("Angles de valeur recommandés pour ce secteur : " + " | ".join(niche.value_propositions))

    return "\n".join(lines)


def _fallback_parse(text: str) -> tuple[str, str]:
    subject = ""
    body = text
    if '"subject"' in text:
        import re
        s_match = re.search(r'"subject"\s*:\s*"([^"]+)"', text)
        b_match = re.search(r'"body"\s*:\s*"([^"]+)"', text, re.DOTALL)
        if s_match:
            subject = s_match.group(1)
        if b_match:
            body = b_match.group(1).replace("\\n", "\n")
    return subject, body
