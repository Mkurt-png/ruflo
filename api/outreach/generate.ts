import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Accept key from request body (client-side) or fallback to server env
  const apiKey = req.body?.api_key || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(400).json({ error: "Clé API Anthropic manquante" });

  const { business_name, category, city, website, analysis } = req.body || {};
  if (!business_name) return res.status(400).json({ error: "business_name is required" });

  try {
    const { subject, body } = await generateEmail({ business_name, category, city, website, analysis }, apiKey);
    return res.json({ subject, body });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
}

// ---------------------------------------------------------------------------

interface LeadInput {
  business_name: string;
  category?: string;
  city?: string;
  website?: string;
  analysis?: Record<string, any>;
}

const SYSTEM_PROMPT = `Tu es un expert en web design et SEO local qui aide les petites entreprises québécoises à attirer plus de clients.

Tu rédiges des emails de prospection ultra-personnalisés, courts et humains:
- En français québécois naturel
- Montrent que tu as vraiment regardé leur site (détails spécifiques)
- Proposent 1-2 améliorations concrètes
- JAMAIS "Je peux vous faire un site web"
- JAMAIS de listes à puces dans l'email
- JAMAIS de phrases génériques
- Court: 4-5 phrases max
- Se termine par une question ouverte simple
- Mentionne ton portfolio: https://rama-barbier.vercel.app

Règle absolue: chaque email doit mentionner un détail SPÉCIFIQUE trouvé sur leur site.`;

async function generateEmail(lead: LeadInput, apiKey: string): Promise<{ subject: string; body: string }> {
  const context = buildContext(lead);

  const payload = {
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Rédige un email de prospection pour cette entreprise.

CONTEXTE:
${context}

FORMAT (JSON uniquement, sans markdown):
{"subject": "...", "body": "..."}

L'email doit mentionner AU MOINS UN problème spécifique détecté.
Sujet: court (max 8 mots), intriguant, spécifique à leur business.
Corps: 4-5 phrases maximum.`,
      },
    ],
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const raw = (data.content?.[0]?.text || "").trim()
    .replace(/^```json?\n?/, "").replace(/```$/, "");

  try {
    const parsed = JSON.parse(raw);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    // Regex fallback
    const subj = raw.match(/"subject"\s*:\s*"([^"]+)"/)?.[1] || "";
    const body = raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}/)?.[1].replace(/\\n/g, "\n") || raw;
    return { subject: subj, body };
  }
}

function buildContext(lead: LeadInput): string {
  const lines = [
    `Entreprise : ${lead.business_name}`,
    `Type : ${lead.category || "Non précisé"}`,
    `Ville : ${lead.city || "Non précisée"}`,
  ];

  if (lead.website) {
    lines.push(`Site web : ${lead.website}`);
  } else {
    lines.push("Site web : AUCUN (opportunité directe)");
  }

  const a = lead.analysis;
  if (a && a.reachable) {
    lines.push(`Score global : ${a.overall_score}/10`);
    lines.push(`Score mobile : ${a.mobile_score}/10`);
    lines.push(`Score SEO : ${a.seo_score}/10`);
    lines.push(`Score vitesse : ${a.speed_score}/10`);
    lines.push(`HTTPS : ${a.has_https ? "Oui" : "NON (problème!)"}`);
    lines.push(`CTA visible : ${a.has_cta ? "Oui" : "Non"}`);
    lines.push(`Formulaire contact : ${a.has_contact_form ? "Oui" : "Non"}`);
    lines.push(`Réservation en ligne : ${a.has_booking ? "Oui" : "Non"}`);
    if (a.issues?.length) {
      lines.push("Problèmes détectés : " + (a.issues as string[]).slice(0, 4).join(" | "));
    }
    if (a.page_title) lines.push(`Titre de la page : ${a.page_title}`);
  } else if (a && !a.reachable) {
    lines.push("Site web : INACCESSIBLE (grosse opportunité)");
  }

  return lines.join("\n");
}
