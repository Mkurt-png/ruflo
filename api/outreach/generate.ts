export default async function handler(req: any, res: any) {
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

Tu rédiges des emails de prospection ultra-personnalisés, courts et humains, qui ressemblent à un VRAI humain qui écrit:
- En français québécois naturel
- Montrent que tu as vraiment regardé leur site (détails spécifiques)
- Proposent 1-2 améliorations concrètes en parlant des BÉNÉFICES (plus de clients, plus d'appels), pas des aspects techniques
- Mentionne ton portfolio: https://rama-barbier.vercel.app

INTERDICTIONS ABSOLUES — l'email NE DOIT JAMAIS contenir:
- Les mots: "IA", "AI", "automatisé", "automation", "intelligence artificielle", "API", "algorithme", "généré", "outil", "script", "robot", "bot", "machine learning", "GPT", "Claude", "ChatGPT", "Anthropic"
- Les mots techniques: "score", "HTTPS", "viewport", "meta description", "H1", "Schema.org", "balise", "DOM", "CSS", "JavaScript", "render-blocking"
- Du jargon SEO/dev: "responsive", "lighthouse", "PageSpeed", "audit technique", "ranking", "indexation"
- Les phrases robotiques: "J'ai remarqué que votre site...", "Selon mon analyse...", "D'après les données..."
- Listes à puces ou tirets dans l'email
- "Je peux vous faire un site web"
- Phrases génériques utilisées par d'autres prospecteurs

OBLIGATOIRE:
- Parle comme un humain qui a regardé leur site sur son téléphone en buvant un café
- Reformule TOUT problème technique en bénéfice business concret pour le client
  (ex: "site sans HTTPS" → "votre site affiche un avertissement de sécurité aux visiteurs sur mobile")
  (ex: "score mobile bas" → "j'ai eu de la misère à naviguer sur mon téléphone")
  (ex: "pas de CTA" → "j'ai cherché comment vous joindre et c'était pas évident")
- Court: 4-5 phrases max
- Se termine par une question ouverte simple
- Mentionne UN détail spécifique de leur site (un nom de plat, une photo, un service précis)

Règle absolue: l'email doit ressembler à un message écrit à la main par quelqu'un qui a vraiment visité le site.`;

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

L'email doit mentionner UNE chose précise que tu as observée sur leur site, formulée comme un client potentiel le dirait (pas comme un technicien).
Sujet: court (max 8 mots), intriguant, spécifique à leur business — sans jargon.
Corps: 4-5 phrases maximum, ton humain et chaleureux.`,
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
