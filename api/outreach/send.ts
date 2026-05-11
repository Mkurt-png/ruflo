export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    resend_key,
    from,
    to,
    reply_to,
    subject,
    body,
  } = req.body || {};

  const apiKey = resend_key || process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(400).json({ error: "Clé Resend manquante" });

  if (!from || !to || !subject || !body) {
    return res.status(400).json({ error: "Champs requis: from, to, subject, body" });
  }

  if (!isValidEmail(to)) {
    return res.status(400).json({ error: "Email destinataire invalide" });
  }

  try {
    const payload: any = {
      from,
      to: [to],
      subject,
      text: body,
      html: textToHtml(body),
    };
    if (reply_to && isValidEmail(reply_to)) payload.reply_to = reply_to;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.message || data?.name || "Échec de l'envoi",
        details: data,
      });
    }

    return res.json({
      sent: true,
      id: data.id,
      to,
      sent_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erreur d'envoi" });
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function textToHtml(text: string): string {
  // Escape HTML special chars then convert newlines to <br>
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Auto-link URLs
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#7c6dfa">$1</a>'
  );

  const paragraphs = linked
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#222;line-height:1.6;max-width:600px">${paragraphs}</body></html>`;
}
