import * as tls from "tls";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    gmail_user,       // your.email@gmail.com
    gmail_app_pass,   // 16-character app password from Google
    from_name,        // display name shown to recipient
    to,
    subject,
    body,
  } = req.body || {};

  if (!gmail_user || !gmail_app_pass) {
    return res.status(400).json({ error: "Gmail et mot de passe d'application requis" });
  }
  if (!isValidEmail(gmail_user)) {
    return res.status(400).json({ error: "Adresse Gmail invalide" });
  }
  if (!isValidEmail(to)) {
    return res.status(400).json({ error: "Email destinataire invalide" });
  }
  if (!subject || !body) {
    return res.status(400).json({ error: "Sujet et corps requis" });
  }

  const fromHeader = from_name
    ? `${encodeMimeHeader(from_name)} <${gmail_user}>`
    : gmail_user;

  try {
    const result = await sendGmailSmtp({
      user: gmail_user,
      pass: gmail_app_pass.replace(/\s+/g, ""),
      from: fromHeader,
      to,
      subject,
      body,
    });
    return res.json({
      sent: true,
      to,
      sent_at: new Date().toISOString(),
      response: result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erreur SMTP" });
  }
}

// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function encodeMimeHeader(text: string): string {
  // RFC 2047 — encode UTF-8 in headers if needed
  if (/^[\x20-\x7e]*$/.test(text)) return `"${text.replace(/"/g, '\\"')}"`;
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function buildMessage(opts: { from: string; to: string; subject: string; body: string }): string {
  const boundary = "----outreach-" + Date.now().toString(36);
  const date = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@outreach>`;

  return [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${encodeMimeHeader(opts.subject)}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    opts.body,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    textToHtml(opts.body),
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#1a73e8">$1</a>'
  );
  const paragraphs = linked.split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#222;line-height:1.6;max-width:600px">${paragraphs}</body></html>`;
}

// ---------------------------------------------------------------------------
// Minimal SMTP client over implicit TLS (smtp.gmail.com:465)
// ---------------------------------------------------------------------------

interface SmtpOptions {
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

function sendGmailSmtp(opts: SmtpOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const message = buildMessage(opts);
    const fromAddr = opts.user;
    const authString = "\0" + opts.user + "\0" + opts.pass;
    const authB64 = Buffer.from(authString, "utf8").toString("base64");

    const socket = tls.connect({
      host: "smtp.gmail.com",
      port: 465,
      servername: "smtp.gmail.com",
    });

    socket.setEncoding("utf8");
    socket.setTimeout(20000);

    let buffer = "";
    let step = 0;
    let lastResponse = "";
    let settled = false;

    const steps: Array<{ expect: number; send: string }> = [
      { expect: 220, send: `EHLO outreach.local\r\n` },
      { expect: 250, send: `AUTH PLAIN ${authB64}\r\n` },
      { expect: 235, send: `MAIL FROM:<${fromAddr}>\r\n` },
      { expect: 250, send: `RCPT TO:<${opts.to}>\r\n` },
      { expect: 250, send: `DATA\r\n` },
      { expect: 354, send: message + "\r\n.\r\n" },
      { expect: 250, send: `QUIT\r\n` },
    ];

    const finish = (err: Error | null, value?: string) => {
      if (settled) return;
      settled = true;
      try { socket.end(); } catch {}
      if (err) reject(err); else resolve(value || lastResponse);
    };

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      while (true) {
        const endIdx = buffer.indexOf("\r\n");
        if (endIdx === -1) break;
        const line = buffer.slice(0, endIdx);
        buffer = buffer.slice(endIdx + 2);

        // Skip multiline continuation lines (NNN-text)
        if (/^\d{3}-/.test(line)) continue;

        lastResponse = line;
        const code = parseInt(line.slice(0, 3), 10);
        const current = steps[step];
        if (!current) continue;

        if (code !== current.expect) {
          const safeLine = line.replace(/AUTH PLAIN \S+/, "AUTH PLAIN ***");
          return finish(new Error(`SMTP ${code}: ${safeLine}`));
        }

        socket.write(current.send);
        step++;

        if (step >= steps.length) return finish(null, lastResponse);
      }
    });

    socket.on("error", (err) => finish(new Error(`SMTP: ${err.message}`)));
    socket.on("timeout", () => finish(new Error("SMTP timeout (20s)")));
    socket.on("end", () => {
      if (!settled && step < steps.length) {
        finish(new Error(`Connexion fermée avant la fin (étape ${step})`));
      }
    });
  });
}
