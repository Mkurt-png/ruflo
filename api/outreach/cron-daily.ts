import * as tls from "tls";

export const maxDuration = 60;

// KV helpers (Vercel KV REST API via fetch — no @vercel/kv package)
const KV_URL = process.env.KV_REST_API_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || "";
const kvOk = () => !!(KV_URL && KV_TOKEN);

async function kvGet(key: string): Promise<string | null> {
  if (!kvOk()) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: "Bearer " + KV_TOKEN }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    return (await r.json())?.result ?? null;
  } catch { return null; }
}

async function kvSet(key: string, value: string): Promise<void> {
  if (!kvOk()) return;
  try { await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, { method: "POST", headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify([value]), signal: AbortSignal.timeout(4000) }); } catch {}
}

async function kvSadd(key: string, member: string): Promise<void> {
  if (!kvOk()) return;
  try { await fetch(`${KV_URL}/sadd/${encodeURIComponent(key)}`, { method: "POST", headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" }, body: JSON.stringify([member]), signal: AbortSignal.timeout(4000) }); } catch {}
}

async function kvSismember(key: string, member: string): Promise<boolean> {
  if (!kvOk()) return false;
  try {
    const r = await fetch(`${KV_URL}/sismember/${encodeURIComponent(key)}/${encodeURIComponent(member)}`, { headers: { Authorization: "Bearer " + KV_TOKEN }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return false;
    return (await r.json())?.result === 1;
  } catch { return false; }
}

// Helpers
function extractDomain(url: string): string {
  try { return new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace(/^www\./, ""); }
  catch { return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]; }
}
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
function isValidEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ""); }

// Target categories + cities
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

// Google Places
interface Place { name: string; address: string; place_id: string; website: string; }

async function searchPlaces(query: string, apiKey: string): Promise<Place[]> {
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=fr&region=ca`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    return ((await r.json()).results || []).slice(0, 10).map((p: any) => ({ name: p.name || "", address: p.formatted_address || "", place_id: p.place_id || "", website: p.website || "" }));
  } catch { return []; }
}

async function getPlaceWebsite(placeId: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=website&key=${apiKey}`, { signal: AbortSignal.timeout(6000) });
    return r.ok ? ((await r.json())?.result?.website || "") : "";
  } catch { return ""; }
}

// Email extraction from website (free, primary method)
const JUNK = ["example.", "noreply", "no-reply", "sentry.", "schema.org", "w3.org", ".png", ".jpg", "wpcf7"];
function isJunk(e: string): boolean { const l = e.toLowerCase(); return JUNK.some(p => l.includes(p)); }

async function extractEmailFromWebsite(url: string): Promise<string> {
  const base = url.replace(/\/$/, "");
  for (const path of ["", "/contact", "/nous-joindre", "/nous-contacter"]) {
    try {
      const r = await fetch(base + path, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)" }, redirect: "follow" });
      if (!r.ok) continue;
      const html = await r.text();
      const mailtoRe = /href=["']mailto:([^"'?]+)/gi;
      let m: RegExpExecArray | null;
      while ((m = mailtoRe.exec(html)) !== null) {
        const e = m[1].trim().toLowerCase();
        if (isValidEmail(e) && !isJunk(e)) return e;
      }
      const emailRe = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/g;
      while ((m = emailRe.exec(html)) !== null) {
        const e = m[1].toLowerCase();
        if (isValidEmail(e) && !isJunk(e)) return e;
      }
    } catch { continue; }
  }
  return "";
}

// Hunter.io fallback
async function hunterFindEmail(domain: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=3`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return "";
    const emails: Array<{ value: string }> = (await r.json())?.data?.emails || [];
    if (!emails.length) return "";
    const preferred = emails.find(e => /contact|info|hello|bonjour/i.test(e.value.split("@")[0]));
    return (preferred || emails[0]).value || "";
  } catch { return ""; }
}

// Site analysis (inline simplified — no import from analyze.ts)
async function analyzeSite(url: string): Promise<Record<string, any>> {
  const a: Record<string, any> = { reachable: false, has_https: url.startsWith("https://"), has_cta: false, has_contact_form: false, has_booking: false, mobile_score: 0, seo_score: 0, speed_score: 0, overall_score: 0, page_title: "", issues: [] as string[] };
  const t0 = Date.now();
  let html = "";
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachBot/1.0)" }, redirect: "follow" });
    const ms = Date.now() - t0;
    a.reachable = r.status < 400;
    a.has_https = r.url.startsWith("https://");
    if (!a.reachable) return a;
    html = await r.text();
    a.speed_score = ms > 5000 ? (a.issues.push("Votre site charge très lentement"), 3) : ms > 3000 ? (a.issues.push("Votre site est lent à charger"), 6) : 9;
  } catch { return a; }

  // SEO
  let seo = 10;
  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  a.page_title = titleM ? titleM[1].trim() : "";
  if (!a.page_title) { seo -= 3; a.issues.push("Votre site n'a pas de titre dans Google"); }
  if (!/<meta[^>]+name=["']description["']/i.test(html)) { seo -= 2; a.issues.push("Pas de description dans les résultats Google"); }
  if (!/<h1[\s>]/i.test(html)) { seo -= 2; a.issues.push("Votre page principale n'a pas de titre principal"); }
  a.seo_score = Math.max(0, Math.min(10, seo));

  // Mobile
  let mobile = 10;
  if (!/viewport/i.test(html)) { mobile -= 4; a.issues.push("Votre site ne s'adapte pas aux téléphones"); }
  if (!/@media/i.test(html)) { mobile -= 3; a.issues.push("Pas de mise en page adaptée aux mobiles"); }
  a.mobile_score = Math.max(0, Math.min(10, mobile));

  // Features
  if (!a.has_https) a.issues.push("Votre site affiche un avertissement de sécurité sur Chrome");
  const h = html.toLowerCase();
  a.has_cta = /contactez|nous contacter|soumission|rendez-vous|réserver|appeler|appelez/.test(h);
  if (!a.has_cta) a.issues.push("Pas d'invitation claire à vous contacter");
  a.has_contact_form = /<form[\s>]/i.test(html);
  if (!a.has_contact_form) a.issues.push("Pas de formulaire de contact sur le site");
  a.has_booking = /calendly|acuity|opentable|booksy|squareup|réserver|reservation|rendez-vous/.test(h);
  a.overall_score = Math.round((a.mobile_score + a.seo_score + a.speed_score) / 3);
  return a;
}

// Email generation (inline — no import from generate.ts)
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

OBLIGATOIRE:
- Parle comme un humain qui a regardé leur site sur son téléphone en buvant un café
- Reformule TOUT problème technique en bénéfice business concret (ex: "site sans HTTPS" → "votre site affiche un avertissement de sécurité aux visiteurs sur mobile")
- Court: 4-5 phrases max
- Se termine par une question ouverte simple
- Mentionne UN détail spécifique de leur site`;

async function generateEmail(name: string, category: string, city: string, website: string, analysis: Record<string, any>, apiKey: string): Promise<{ subject: string; body: string }> {
  const ctx = [`Entreprise : ${name}`, `Type : ${category}`, `Ville : ${city}`, `Site web : ${website || "AUCUN"}`];
  if (analysis?.reachable) {
    ctx.push(`Score global : ${analysis.overall_score}/10`, `Score mobile : ${analysis.mobile_score}/10`, `HTTPS : ${analysis.has_https ? "Oui" : "NON"}`, `CTA : ${analysis.has_cta ? "Oui" : "Non"}`, `Formulaire : ${analysis.has_contact_form ? "Oui" : "Non"}`);
    if (analysis.issues?.length) ctx.push("Problèmes : " + (analysis.issues as string[]).slice(0, 4).join(" | "));
    if (analysis.page_title) ctx.push(`Titre : ${analysis.page_title}`);
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, system: SYSTEM_PROMPT, messages: [{ role: "user", content: `Rédige un email de prospection pour cette entreprise.\n\nCONTEXTE:\n${ctx.join("\n")}\n\nFORMAT (JSON uniquement, sans markdown):\n{"subject": "...", "body": "..."}\n\nSujet: max 8 mots. Corps: 4-5 phrases max.` }] }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Claude API ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const raw = ((await r.json()).content?.[0]?.text || "").trim().replace(/^```json?\n?/, "").replace(/```$/, "");
  try { const p = JSON.parse(raw); return { subject: p.subject || "", body: p.body || "" }; }
  catch { return { subject: raw.match(/"subject"\s*:\s*"([^"]+)"/)?.[1] || "", body: raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}/)?.[1]?.replace(/\\n/g, "\n") || raw }; }
}

// Gmail SMTP (inline — same logic as send.ts, no import)
function encodeMimeHeader(text: string): string {
  return /^[\x20-\x7e]*$/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}
function textToHtml(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const linked = esc.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1a73e8">$1</a>');
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#222;line-height:1.6;max-width:600px">${linked.split(/\n{2,}/).map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`).join("")}</body></html>`;
}
function buildMessage(from: string, to: string, subject: string, body: string): string {
  const b = "----outreach-" + Date.now().toString(36);
  return [`From: ${from}`, `To: ${to}`, `Subject: ${encodeMimeHeader(subject)}`, `Date: ${new Date().toUTCString()}`, `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@outreach>`, `MIME-Version: 1.0`, `Content-Type: multipart/alternative; boundary="${b}"`, ``, `--${b}`, `Content-Type: text/plain; charset=UTF-8`, `Content-Transfer-Encoding: 8bit`, ``, body, ``, `--${b}`, `Content-Type: text/html; charset=UTF-8`, `Content-Transfer-Encoding: 8bit`, ``, textToHtml(body), ``, `--${b}--`, ``].join("\r\n");
}

async function sendEmail(opts: { user: string; pass: string; fromName: string; to: string; subject: string; body: string }): Promise<void> {
  const from = opts.fromName ? `${encodeMimeHeader(opts.fromName)} <${opts.user}>` : opts.user;
  const msg = buildMessage(from, opts.to, opts.subject, opts.body);
  const authB64 = Buffer.from("\0" + opts.user + "\0" + opts.pass, "utf8").toString("base64");
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });
    socket.setEncoding("utf8");
    socket.setTimeout(25000);
    let buf = "", step = 0, settled = false;
    const steps = [{ expect: 220, send: `EHLO outreach.local\r\n` }, { expect: 250, send: `AUTH PLAIN ${authB64}\r\n` }, { expect: 235, send: `MAIL FROM:<${opts.user}>\r\n` }, { expect: 250, send: `RCPT TO:<${opts.to}>\r\n` }, { expect: 250, send: `DATA\r\n` }, { expect: 354, send: msg + "\r\n.\r\n" }, { expect: 250, send: `QUIT\r\n` }];
    const done = (err: Error | null) => { if (settled) return; settled = true; try { socket.end(); } catch {} err ? reject(err) : resolve(); };
    socket.on("data", (chunk: string) => {
      buf += chunk;
      while (true) {
        const i = buf.indexOf("\r\n"); if (i === -1) break;
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (/^\d{3}-/.test(line)) continue;
        const code = parseInt(line.slice(0, 3), 10), cur = steps[step];
        if (!cur) continue;
        if (code !== cur.expect) return done(new Error(`SMTP ${code}: ${line.replace(/AUTH PLAIN \S+/, "AUTH PLAIN ***")}`));
        socket.write(cur.send); step++;
        if (step >= steps.length) return done(null);
      }
    });
    socket.on("error", (e) => done(new Error(`SMTP: ${e.message}`)));
    socket.on("timeout", () => done(new Error("SMTP timeout")));
    socket.on("end", () => { if (!settled) done(new Error(`Connexion fermée (étape ${step})`)); });
  });
}

// Main handler
export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const CRON_SECRET = process.env.CRON_SECRET || "";
  if (CRON_SECRET && req.headers.authorization !== "Bearer " + CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
  const GMAIL_USER = process.env.GMAIL_USER || "";
  const GMAIL_APP_PASS = (process.env.GMAIL_APP_PASS || "").replace(/\s+/g, "");
  const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_KEY || "";
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";
  const FROM_NAME = process.env.FROM_NAME || "Design Web";
  const SENDER_ADDRESS = process.env.SENDER_ADDRESS || "Montréal, QC, Canada";
  const UNSUB_BASE = (process.env.UNSUBSCRIBE_BASE_URL || "").replace(/\/$/, "");
  const DAILY_TARGET = parseInt(process.env.DAILY_EMAIL_TARGET || "15", 10);

  const missing = ["ANTHROPIC_API_KEY", "GMAIL_USER", "GMAIL_APP_PASS", "GOOGLE_PLACES_KEY"].filter(k => !process.env[k]);
  if (missing.length) return res.status(400).json({ error: "Missing env vars: " + missing.join(", ") });

  const today = new Date().toISOString().slice(0, 10);
  const results = { sent: 0, skipped: 0, errors: 0, businesses: [] as string[] };

  outer:
  for (const target of TARGETS) {
    let places: Place[] = [];
    try { places = await searchPlaces(`${target.category} ${target.city}`, GOOGLE_PLACES_KEY); } catch { results.errors++; continue; }

    for (const place of places) {
      if (results.sent >= DAILY_TARGET) break outer;

      let website = place.website;
      if (!website && place.place_id) website = await getPlaceWebsite(place.place_id, GOOGLE_PLACES_KEY);
      if (!website) { results.skipped++; continue; }

      const domain = extractDomain(website);
      if (!domain) { results.skipped++; continue; }
      if (await kvSismember("contacted_domains", domain)) { results.skipped++; continue; }

      let email = await extractEmailFromWebsite(website);
      if (!email && HUNTER_API_KEY) email = await hunterFindEmail(domain, HUNTER_API_KEY);
      if (!email || !isValidEmail(email)) { results.skipped++; continue; }
      if (await kvSismember("unsubscribed", email)) { results.skipped++; continue; }

      let analysis: Record<string, any> = { reachable: false };
      try { analysis = await analyzeSite(website); } catch {}

      let subject = "", body = "";
      try {
        const gen = await generateEmail(place.name, target.category, target.city, website, analysis, ANTHROPIC_API_KEY);
        subject = gen.subject; body = gen.body;
      } catch { results.errors++; continue; }
      if (!subject || !body) { results.errors++; continue; }

      // CASL footer
      const token = Buffer.from(email, "utf8").toString("base64url");
      let footer = `\n\n---\nEnvoyé par ${FROM_NAME} | ${SENDER_ADDRESS}`;
      if (UNSUB_BASE) footer += `\nPour ne plus recevoir mes emails : ${UNSUB_BASE}/api/outreach/unsubscribe?token=${token}`;
      body = body + footer;

      try {
        await sendEmail({ user: GMAIL_USER, pass: GMAIL_APP_PASS, fromName: FROM_NAME, to: email, subject, body });
      } catch { results.errors++; continue; }

      await kvSadd("contacted_domains", domain);
      results.sent++;
      results.businesses.push(`${place.name} (${target.city}) → ${email}`);
      await sleep(1500);
    }
  }

  // Save daily stats
  await kvSet(`stats_${today}`, JSON.stringify({ ...results, date: today }));

  // Summary email to self
  try {
    const bizList = results.businesses.map(b => `  - ${b}`).join("\n");
    await sendEmail({
      user: GMAIL_USER, pass: GMAIL_APP_PASS, fromName: FROM_NAME, to: GMAIL_USER,
      subject: `[Outreach] Rapport ${today} — ${results.sent} emails envoyés`,
      body: `Rapport outreach — ${today}\n\nEnvoyés : ${results.sent}\nIgnorés  : ${results.skipped}\nErreurs  : ${results.errors}\n\nEntreprises contactées :\n${bizList || "  (aucune)"}`,
    });
  } catch {}

  return res.json({ success: true, date: today, ...results });
}
