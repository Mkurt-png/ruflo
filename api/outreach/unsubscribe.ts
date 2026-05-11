// GET /api/outreach/unsubscribe?token=base64urlEncodedEmail
// Decodes the email, adds it to the KV "unsubscribed" set, returns a confirmation page.

// KV helpers (Vercel KV REST API via fetch — no @vercel/kv package)
const KV_URL = process.env.KV_REST_API_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || "";
const kvOk = () => !!(KV_URL && KV_TOKEN);

async function kvSadd(key: string, member: string): Promise<void> {
  if (!kvOk()) return;
  try {
    await fetch(`${KV_URL}/sadd/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: "Bearer " + KV_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify([member]),
      signal: AbortSignal.timeout(4000),
    });
  } catch {}
}

function htmlPage(title: string, message: string, isError = false): string {
  const color = isError ? "#f87171" : "#4ade80";
  const icon = isError ? "✗" : "✓";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f0f13; color: #e2e2ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #1a1a24; border: 1px solid #2a2a38; border-radius: 12px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; }
    .icon { font-size: 2.5rem; color: ${color}; margin-bottom: 16px; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #e2e2ef; }
    p { font-size: 0.9rem; color: #8888aa; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const token = (req.query?.token || "") as string;

  if (!token) {
    res.status(400).send(htmlPage(
      "Lien invalide",
      "Ce lien de désinscription est invalide ou incomplet. Contactez-nous directement si vous souhaitez vous désinscrire.",
      true,
    ));
    return;
  }

  // Decode base64url → email
  let email = "";
  try {
    // base64url: replace - with + and _ with /
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    email = Buffer.from(base64, "base64").toString("utf8").trim().toLowerCase();
  } catch {
    res.status(400).send(htmlPage(
      "Lien invalide",
      "Impossible de décoder ce lien de désinscription. Contactez-nous directement.",
      true,
    ));
    return;
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).send(htmlPage(
      "Lien invalide",
      "Ce lien ne contient pas d'adresse email valide. Contactez-nous directement.",
      true,
    ));
    return;
  }

  // Add to unsubscribed set
  await kvSadd("unsubscribed", email);

  res.status(200).send(htmlPage(
    "Vous avez été désinscrit avec succès",
    "Vous ne recevrez plus d'emails de notre part. Si vous changez d'avis, n'hésitez pas à nous écrire directement.",
  ));
}
