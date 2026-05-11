import * as tls from "tls";

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

const KV_URL = process.env.KV_REST_API_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || "";
const KV_ENABLED = !!(KV_URL && KV_TOKEN);

async function kvGet(key: string): Promise<string | null> {
  if (!KV_ENABLED) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: "Bearer " + KV_TOKEN },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.result ?? null;
  } catch { return null; }
}

async function kvSet(key: string, value: string): Promise<void> {
  if (!KV_ENABLED) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify([value]),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}
}

async function kvSadd(key: string, member: string): Promise<void> {
  if (!KV_ENABLED) return;
  try {
    await fetch(`${KV_URL}/sadd/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify([member]),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}
}

async function kvSismember(key: string, member: string): Promise<boolean> {
  if (!KV_ENABLED) return false;
  try {
    const r = await fetch(`${KV_URL}/sismember/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, {
      headers: { Authorization: "Bearer " + KV_TOKEN },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return false;
    const d = await r.json();
    return d?.result === 1;
  } catch { return false; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : "https://" + url);
    return u.hostname.replace(/^www\./, "");
  } catch { return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]; }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

interface Place {
  name: string;
  address: string;
  place_id: string;
  website: string;
}

async function searchPlaces(query: string, apiKey: string): Promise<Place[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr&region=ca`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).slice(0, 10).map((p: any) => ({
      name: p.name || "",
      address: p.formatted_address || "",
      place_id: p.place_id || "",
      website: p.website || "",
    }));
  } catch { return []; }
}

async function getPlaceWebsite(placeId: string, apiKey: string): Promise<string> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=website&key=${apiKey}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return "";
    const data = await r.json();
    return data?.result?.website || "";
  } catch { return ""; }
}

// ---------------------------------------------------------------------------
// Email extraction
// ---------------------------------------------------------------------------

const JUNK_EMAIL_PATTERNS = ["example.", "noreply", "no-reply", "sentry.", "schema.org", "w3.org", ".png", ".jpg", "wpcf7"];

function isJunkEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return JUNK_EMAIL_PATTERNS.some(p => lower.includes(p));
}

async function fetchPageHtml(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)" },
      redirect: "follow",
    });
    if (!r.ok) return "";
    return await r.text();
  } catch { return ""; }
}

function extractEmailsFromHtml(html: string): string[] {
  const emails: string[] = [];

  // mailto links first (higher quality)
  const mailtoRe = /href=["']mailto:([^"'?]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) {
    const e = m[1].trim().toLowerCase();
    if (isValidEmail(e) && !isJunkEmail(e)) emails.push(e);
  }

  // Regex fallback
  const emailRe = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/g;
  while ((m = emailRe.exec(html)) !== null) {
    const e = m[1].trim().toLowerCase();
    if (isValidEmail(e) && !isJunkEmail(e) && !emails.includes(e)) emails.push(e);
  }

  return emails;
}

async function extractEmailFromWebsite(url: string): Promise<string> {
  const base = url.replace(/\/$/, "");
  const paths = ["", "/contact", "/nous-joindre", "/nous-contacter"];

  for (const path of paths) {
    const html = await fetchPageHtml(base + path);
    if (!html) continue;
    const emails = extractEmailsFromHtml(html);
    if (emails.length > 0) return emails[0];
  }
  return "";
}

// ---------------------------------------------------------------------------
// Hunter.io fallback
// ---------------------------------------------------------------------------

async function hunterFindEmail(domain: string, apiKey: string): Promise<string> {
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=3`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return "";
    const data = await r.json();
    const emails: Array<{ value: string; type: string }> = data?.data?.emails || [];
    if (!emails.length) return "";

    // Prefer contact/info/hello/bonjour emails
    const preferred = emails.find(e =>
      /contact|info|hello|bonjour/i.test(e.value.split("@")[0])
    );
    return (preferred || emails[0]).value || "";
  } catch { return ""; }
}

// ---------------------------------------------------------------------------
// Site analysis (inline simplified)
// ---------------------------------------------------------------------------

async function analyzeSite(url: string): Promise<Record<string, any>> {
  const a: Record<string, any> = {
    url,
    reachable: false,
    has_https: url.startsWith("https://"),
    has_cta: false,
    has_contact_form: false,
    has_booking: false,
    mobile_score: 0,
    seo_score: 0,
    speed_score: 0,
    overall_score: 0,
    page_title: "",
    issues: [] as string[],
  };

  const t0 = Date.now();
  let html = "";

  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)" },
      redirect: "follow",
    });
    const loadMs = Date.now() - t0;
    a.reachable = r.status < 400;
    a.has_https = r.url.startsWith("https://");
    if (!a.reachable) return a;
    html = await r.text();

    // Speed
    if (loadMs > 5000) { a.speed_score = 3; a.issues.push("Votre site charge très lentement (plus de 5 secondes)"); }
    else if (loadMs > 3000) { a.speed_score = 6; a.issues.push("Votre site est un peu lent à charger"); }
    else { a.speed_score = 9; }
  } catch { return a; }

  // SEO
  let seo = 10;
  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  a.page_title = titleM ? titleM[1].trim() : "";
  if (!a.page_title) { seo -= 3; a.issues.push("Votre site n'a pas de titre visible dans les résultats Google"); }
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (!metaDesc) { seo -= 2; a.issues.push("Votre site manque de description dans les résultats Google"); }
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length === 0) { seo -= 2; a.issues.push("Votre page principale n'a pas de titre principal"); }
  a.seo_score = Math.max(0, Math.min(10, seo));

  // Mobile
  let mobile = 10;
  if (!/viewport/i.test(html)) { mobile -= 4; a.issues.push("Votre site ne s'adapte pas aux téléphones mobiles"); }
  if (!/@media/i.test(html)) { mobile -= 3; a.issues.push("Votre site n'a pas de mise en page adaptée aux mobiles"); }
  a.mobile_score = Math.max(0, Math.min(10, mobile));

  // Features
  if (!a.has_https) a.issues.push("Votre site affiche un avertissement de sécurité aux visiteurs sur Chrome");
  const h = html.toLowerCase();
  const ctaKw = ["contactez", "nous contacter", "soumission", "rendez-vous", "réserver", "appeler", "appelez"];
  a.has_cta = ctaKw.some(k => h.includes(k));
  if (!a.has_cta) a.issues.push("Pas d'invitation claire à vous contacter ou à prendre rendez-vous");
  a.has_contact_form = /<form[\s>]/i.test(html);
  if (!a.has_contact_form) a.issues.push("Pas de formulaire de contact sur le site");
  const bookingKw = ["calendly", "acuity", "opentable", "resy", "booksy", "squareup", "réserver", "reservation", "rendez-vous"];
  a.has_booking = bookingKw.some(k => h.includes(k));

  a.overall_score = Math.round((a.mobile_score + a.seo_score + a.speed_score) / 3);
  return a;
}

// ---------------------------------------------------------------------------
// Email generation (inline)
// ---------------------------------------------------------------------------

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

async function generateEmail(
  business_name: string,
  category: string,
  city: string,
  website: string,
  analysis: Record<string, any>,
  apiKey: string
): Promise<{ subject: string; body: string }> {
  const lines = [
    `Entreprise : ${business_name}`,
    `Type : ${category}`,
    `Ville : ${city}`,
    `Site web : ${website || "AUCUN"}`,
  ];
  if (analysis?.reachable) {
    lines.push(`Score global : ${analysis.overall_score}/10`);
    lines.push(`Score mobile : ${analysis.mobile_score}/10`);
    lines.push(`HTTPS : ${analysis.has_https ? "Oui" : "NON (problème!)"}`);
    lines.push(`CTA visible : ${analysis.has_cta ? "Oui" : "Non"}`);
    lines.push(`Formulaire contact : ${analysis.has_contact_form ? "Oui" : "Non"}`);
    if (analysis.issues?.length) {
      lines.push("Problèmes détectés : " + (analysis.issues as string[]).slice(0, 4).join(" | "));
    }
    if (analysis.page_title) lines.push(`Titre de la page : ${analysis.page_title}`);
  }

  const payload = {
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: `Rédige un email de prospection pour cette entreprise.\n\nCONTEXTE:\n${lines.join("\n")}\n\nFORMAT (JSON uniquement, sans markdown):\n{"subject": "...", "body": "..."}\n\nL'email doit mentionner UNE chose précise que tu as observée sur leur site. Sujet: court (max 8 mots). Corps: 4-5 phrases maximum.`,
    }],
  };

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Claude API ${r.status}: ${err}`);
  }

  const data = await r.json();
  const raw = (data.content?.[0]?.text || "").trim()
    .replace(/^```json?\n?/, "").replace(/```$/, "");

  try {
    const parsed = JSON.parse(raw);
    return { subject: parsed.subject || "", body: parsed.body || "" };
  } catch {
    const subj = raw.match(/"subject"\s*:\s*"([^"]+)"/)?.[1] || "";
    const body = raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}/)?.[1]?.replace(/\\n/g, "\n") || raw;
    return { subject: subj, body };
  }
}

// ---------------------------------------------------------------------------
// Gmail SMTP (inline)
// ---------------------------------------------------------------------------

function encodeMimeHeader(text: string): string {
  if (/^[\x20-\x7e]*$/.test(text)) return `"${text.replace(/"/g, '\\"')}"`;
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const linked = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1a73e8">$1</a>');
  const paragraphs = linked.split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#222;line-height:1.6;max-width:600px">${paragraphs}</body></html>`;
}

function buildMessage(from: string, to: string, subject: string, body: string): string {
  const boundary = "----outreach-" + Date.now().toString(36);
  const date = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@outreach>`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textToHtml(body),
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

async function sendEmail(opts: {
  user: string;
  pass: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const fromHeader = opts.fromName
    ? `${encodeMimeHeader(opts.fromName)} <${opts.user}>`
    : opts.user;
  const message = buildMessage(fromHeader, opts.to, opts.subject, opts.body);
  const authString = "\0" + opts.user + "\0" + opts.pass;
  const authB64 = Buffer.from(authString, "utf8").toString("base64");

  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });
    socket.setEncoding("utf8");
    socket.setTimeout(25000);

    let buffer = "";
    let step = 0;
    let settled = false;

    const steps: Array<{ expect: number; send: string }> = [
      { expect: 220, send: `EHLO outreach.local\r\n` },
      { expect: 250, send: `AUTH PLAIN ${authB64}\r\n` },
      { expect: 235, send: `MAIL FROM:<${opts.user}>\r\n` },
      { expect: 250, send: `RCPT TO:<${opts.to}>\r\n` },
      { expect: 250, send: `DATA\r\n` },
      { expect: 354, send: message + "\r\n.\r\n" },
      { expect: 250, send: `QUIT\r\n` },
    ];

    const finish = (err: Error | null) => {
      if (settled) return;
      settled = true;
      try { socket.end(); } catch {}
      if (err) reject(err); else resolve();
    };

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      while (true) {
        const idx = buffer.indexOf("\r\n");
        if (idx === -1) break;
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (/^\d{3}-/.test(line)) continue;
        const code = parseInt(line.slice(0, 3), 10);
        const current = steps[step];
        if (!current) continue;
        if (code !== current.expect) {
          return finish(new Error(`SMTP ${code}: ${line.replace(/AUTH PLAIN \S+/, "AUTH PLAIN ***")}`));
        }
        socket.write(current.send);
        step++;
        if (step >= steps.length) return finish(null);
      }
    });
    socket.on("error", (e) => finish(new Error(`SMTP: ${e.message}`)));
    socket.on("timeout", () => finish(new Error("SMTP timeout")));
    socket.on("end", () => { if (!settled) finish(new Error(`Connexion fermée (étape ${step})`)); });
  });
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

const TARGETS = [
  { category: "restaurant", city: "Montréal" },
  { category: "restaurant", city: "Victoriaville" },
  { category: "plombier", city: "Montréal" },
  { category: "salon de coiffure", city: "Montréal" },
  { category: "dentiste", city: "Victoriaville" },
  { category: "garage auto", city: "Montréal" },
  { category: "salon de coiffure", city: "Victoriaville" },
  { category: "gym fitness", city: "Montréal" },
];

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req: any, res: any) {
  // Allow both GET (cron) and POST (manual trigger)
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify cron secret if set
  const CRON_SECRET = process.env.CRON_SECRET || "";
  if (CRON_SECRET) {
    const auth = req.headers.authorization || "";
    if (auth !== "Bearer " + CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  // Required env vars
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
  const GMAIL_USER = process.env.GMAIL_USER || "";
  const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || "";
  const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY || "";
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";
  const FROM_NAME = process.env.FROM_NAME || "Design Web";
  const SENDER_ADDRESS = process.env.SENDER_ADDRESS || "Montréal, QC, Canada";
  const UNSUBSCRIBE_BASE_URL = (process.env.UNSUBSCRIBE_BASE_URL || "").replace(/\/$/, "");
  const DAILY_TARGET = parseInt(process.env.DAILY_EMAIL_TARGET || "15", 10);

  const missing: string[] = [];
  if (!ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (!GMAIL_USER) missing.push("GMAIL_USER");
  if (!GMAIL_APP_PASS) missing.push("GMAIL_APP_PASS");
  if (!GOOGLE_PLACES_KEY) missing.push("GOOGLE_PLACES_KEY");
  if (missing.length) {
    return res.status(400).json({ error: "Missing env vars: " + missing.join(", ") });
  }

  const today = new Date().toISOString().slice(0, 10);
  const results: { sent: number; skipped: number; errors: number; businesses: string[] } = {
    sent: 0,
    skipped: 0,
    errors: 0,
    businesses: [],
  };

  outer:
  for (const target of TARGETS) {
    const query = `${target.category} ${target.city}`;
    let places: Place[] = [];
    try {
      places = await searchPlaces(query, GOOGLE_PLACES_KEY);
    } catch {
      results.errors++;
      continue;
    }

    for (const place of places) {
      if (results.sent >= DAILY_TARGET) break outer;

      // Get website
      let website = place.website;
      if (!website && place.place_id) {
        website = await getPlaceWebsite(place.place_id, GOOGLE_PLACES_KEY);
      }
      if (!website) { results.skipped++; continue; }

      const domain = extractDomain(website);
      if (!domain) { results.skipped++; continue; }

      // Dedup check
      const alreadyContacted = await kvSismember("contacted_domains", domain);
      if (alreadyContacted) { results.skipped++; continue; }

      // Find email
      let email = await extractEmailFromWebsite(website);
      if (!email && HUNTER_API_KEY) {
        email = await hunterFindEmail(domain, HUNTER_API_KEY);
      }
      if (!email || !isValidEmail(email)) { results.skipped++; continue; }

      // Unsubscribe check
      const unsubscribed = await kvSismember("unsubscribed", email);
      if (unsubscribed) { results.skipped++; continue; }

      // Analyze site
      let analysis: Record<string, any> = { reachable: false };
      try {
        analysis = await analyzeSite(website);
      } catch {}

      // Generate email
      let subject = "";
      let body = "";
      try {
        const generated = await generateEmail(
          place.name,
          target.category,
          target.city,
          website,
          analysis,
          ANTHROPIC_API_KEY
        );
        subject = generated.subject;
        body = generated.body;
      } catch (e: any) {
        results.errors++;
        continue;
      }

      if (!subject || !body) { results.errors++; continue; }

      // Append CASL footer
      const footer = buildCaslFooter(FROM_NAME, SENDER_ADDRESS, UNSUBSCRIBE_BASE_URL, email);
      const fullBody = body + "\n\n" + footer;

      // Send
      try {
        await sendEmail({
          user: GMAIL_USER,
          pass: GMAIL_APP_PASS.replace(/\s+/g, ""),
          fromName: FROM_NAME,
          to: email,
          subject,
          body: fullBody,
        });
      } catch (e: any) {
        results.errors++;
        continue;
      }

      // Mark as contacted
      await kvSadd("contacted_domains", domain);
      results.sent++;
      results.businesses.push(`${place.name} (${target.city}) → ${email}`);

      await sleep(1500);
      if (results.sent >= DAILY_TARGET) break outer;
    }
  }

  // Save daily stats
  await kvSet(`stats_${today}`, JSON.stringify({ ...results, date: today }));

  // Send summary email to self
  if (GMAIL_USER) {
    const summarySubject = `[Outreach] Rapport ${today} — ${results.sent} emails envoyés`;
    const summaryBody = buildSummaryEmail(today, results);
    try {
      await sendEmail({
        user: GMAIL_USER,
        pass: GMAIL_APP_PASS.replace(/\s+/g, ""),
        fromName: FROM_NAME,
        to: GMAIL_USER,
        subject: summarySubject,
        body: summaryBody,
      });
    } catch {}
  }

  return res.json({ success: true, date: today, ...results });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCaslFooter(fromName: string, senderAddress: string, unsubscribeBase: string, email: string): string {
  const token = Buffer.from(email, "utf8").toString("base64url");
  let footer = `---\nEnvoyé par ${fromName} | ${senderAddress}`;
  if (unsubscribeBase) {
    footer += `\nPour ne plus recevoir mes emails : ${unsubscribeBase}/api/outreach/unsubscribe?token=${token}`;
  }
  return footer;
}

function buildSummaryEmail(date: string, results: { sent: number; skipped: number; errors: number; businesses: string[] }): string {
  const lines = [
    `Rapport de la campagne outreach du ${date}`,
    ``,
    `Résultats:`,
    `  Envoyés  : ${results.sent}`,
    `  Ignorés  : ${results.skipped}`,
    `  Erreurs  : ${results.errors}`,
    ``,
  ];
  if (results.businesses.length) {
    lines.push("Emails envoyés à :");
    results.businesses.forEach(b => lines.push(`  - ${b}`));
  } else {
    lines.push("Aucun email envoyé.");
  }
  return lines.join("\n");
}
