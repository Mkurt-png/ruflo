import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  const normalized = url.startsWith("http") ? url : `https://${url}`;

  try {
    const result = await analyzeWebsite(normalized);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}

// ---------------------------------------------------------------------------

interface Analysis {
  url: string;
  reachable: boolean;
  has_https: boolean;
  load_time_ms: number;
  mobile_score: number;
  seo_score: number;
  speed_score: number;
  design_score: number;
  overall_score: number;
  needs_redesign: boolean;
  has_cta: boolean;
  has_contact_form: boolean;
  has_booking: boolean;
  has_https_valid: boolean;
  page_title: string;
  meta_description: string;
  issues: string[];
  recommendations: string[];
}

async function analyzeWebsite(url: string): Promise<Analysis> {
  const a: Analysis = {
    url,
    reachable: false,
    has_https: url.startsWith("https://"),
    load_time_ms: 0,
    mobile_score: 0,
    seo_score: 0,
    speed_score: 0,
    design_score: 0,
    overall_score: 0,
    needs_redesign: true,
    has_cta: false,
    has_contact_form: false,
    has_booking: false,
    has_https_valid: false,
    page_title: "",
    meta_description: "",
    issues: [],
    recommendations: [],
  };

  const t0 = Date.now();
  let html = "";

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)" },
      redirect: "follow",
    });
    a.load_time_ms = Date.now() - t0;
    a.reachable = resp.status < 400;
    a.has_https = resp.url.startsWith("https://");
    if (!a.reachable) {
      a.issues.push(`Site inaccessible (HTTP ${resp.status})`);
      return a;
    }
    html = await resp.text();
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.message?.includes("timeout")) {
      a.issues.push("Site trop lent (timeout > 12s)");
      a.speed_score = 1;
    } else {
      a.issues.push(`Impossible de joindre le site: ${err.message}`);
    }
    return a;
  }

  scoreSeo(a, html);
  scoreMobile(a, html);
  scoreSpeed(a, html, a.load_time_ms);
  scoreDesign(a, html);
  detectFeatures(a, html);
  buildRecommendations(a);

  a.overall_score = Math.round((a.mobile_score + a.seo_score + a.speed_score + a.design_score) / 4);
  a.needs_redesign = a.overall_score < 6;

  return a;
}

function scoreSeo(a: Analysis, html: string): void {
  let score = 10;

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  a.page_title = titleMatch ? titleMatch[1].trim() : "";
  if (!a.page_title) { score -= 3; a.issues.push("Pas de balise <title>"); }
  else if (a.page_title.length > 70) { score -= 1; a.issues.push("Titre trop long (>70 chars)"); }

  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  a.meta_description = metaDesc ? metaDesc[1].trim() : "";
  if (!a.meta_description) { score -= 2; a.issues.push("Pas de meta description"); }

  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length === 0) { score -= 2; a.issues.push("Aucun H1 sur la page"); }
  else if (h1s.length > 1) { score -= 1; a.issues.push(`${h1s.length} H1 — mauvais pour le SEO`); }

  const imgTags = html.match(/<img[^>]+>/gi) || [];
  const imgsNoAlt = imgTags.filter(t => !/alt=/i.test(t));
  if (imgsNoAlt.length > 0) { score -= 1; a.issues.push(`${imgsNoAlt.length} image(s) sans alt`); }

  if (!html.includes('"@context"') && !html.includes("itemscope")) {
    score -= 1; a.issues.push("Pas de données structurées (Schema.org)");
  }

  a.seo_score = Math.max(0, Math.min(10, score));
}

function scoreMobile(a: Analysis, html: string): void {
  let score = 10;
  if (!/viewport/i.test(html)) { score -= 4; a.issues.push("Pas de viewport — site non mobile-friendly"); }
  if (!/@media/i.test(html)) { score -= 3; a.issues.push("Pas de CSS responsive détecté"); }
  a.mobile_score = Math.max(0, Math.min(10, score));
}

function scoreSpeed(a: Analysis, html: string, loadMs: number): void {
  let score = 10;
  if (loadMs > 5000) { score -= 4; a.issues.push(`Chargement très lent: ${(loadMs/1000).toFixed(1)}s`); }
  else if (loadMs > 3000) { score -= 2; a.issues.push(`Chargement lent: ${(loadMs/1000).toFixed(1)}s`); }

  const blockingCount = (html.match(/rel=["']stylesheet["']/gi)?.length || 0)
    + (html.match(/<script[^>]+src=/gi)?.length || 0);
  if (blockingCount > 10) { score -= 2; a.issues.push(`${blockingCount} ressources bloquantes`); }

  a.speed_score = Math.max(0, Math.min(10, score));
}

function scoreDesign(a: Analysis, html: string): void {
  let score = 7;
  if (!/rel=["'].*icon["']/i.test(html)) { score -= 1; a.issues.push("Pas de favicon"); }
  if (!/"og:image"/.test(html) && !/property=["']og:image["']/.test(html)) {
    score -= 1; a.issues.push("Pas d'image Open Graph");
  }
  if (!/<footer[\s>]/i.test(html)) { score -= 1; a.issues.push("Pas de footer structuré"); }
  a.design_score = Math.max(0, Math.min(10, score));
}

function detectFeatures(a: Analysis, html: string): void {
  const h = html.toLowerCase();
  if (!a.has_https) a.issues.push("Site sans HTTPS — bloqué par Chrome mobile");

  const ctaPatterns = ["contactez", "nous contacter", "soumission", "rendez-vous",
    "réserver", "appeler", "call now", "get a quote", "book now"];
  a.has_cta = ctaPatterns.some(p => h.includes(p));
  if (!a.has_cta) a.issues.push("Pas de CTA (call-to-action) clair");

  a.has_contact_form = /<form[\s>]/i.test(html);
  if (!a.has_contact_form) a.issues.push("Pas de formulaire de contact");

  const bookingKw = ["calendly", "acuity", "opentable", "resy", "booksy",
    "squareup", "réserver", "reservation", "rendez-vous"];
  a.has_booking = bookingKw.some(k => h.includes(k));
}

function buildRecommendations(a: Analysis): void {
  const recs: string[] = [];
  if (!a.has_https) recs.push("Activer HTTPS — priorité absolue");
  if (a.mobile_score < 6) recs.push("Rendre le site 100% mobile-friendly");
  if (a.speed_score < 6) recs.push("Optimiser la vitesse (objectif < 3s)");
  if (a.seo_score < 6) recs.push("Corriger les bases SEO (titre, meta, H1)");
  if (!a.has_cta) recs.push("Ajouter un CTA clair et visible");
  if (!a.has_contact_form) recs.push("Ajouter un formulaire de contact");
  if (!a.has_booking) recs.push("Intégrer un système de réservation en ligne");
  a.recommendations = recs.slice(0, 5);
}
