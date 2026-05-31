// TICKRA-PHASE-2.1: thin wrapper around Anthropic's Messages API.
// Uses plain fetch — no SDK — to keep the bundle lean and the dependency
// surface tight. Returns a streaming text response (Server-Sent Events).
//
// Env required to activate:
//   ANTHROPIC_API_KEY     sk-ant-…
//   ANTHROPIC_MODEL       (optional) defaults to a widely-available Haiku
//
// Without ANTHROPIC_API_KEY, the wrapper returns a not_configured error so
// the front-end can show a graceful fallback ("AI is currently offline").

// TICKRA-FIX: default to the publicly available Haiku 3.5 (every account has
// access, ~$0.001/question). Override with ANTHROPIC_MODEL env var to switch
// to a newer/larger model once your account has access.
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

export type AiMessage = { role: 'user' | 'assistant'; content: string };

export type AiResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; reason: 'not_configured' | 'api_error'; detail?: string };

export async function streamChat(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens = 800,
): Promise<AiResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => 'unknown');
    return { ok: false, reason: 'api_error', detail: detail.slice(0, 500) };
  }

  // Adapt Anthropic's SSE stream into a plain text stream of just the delta
  // content, so the client can consume it without parsing SSE itself.
  const transformer = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta' && json.delta.text) {
            controller.enqueue(new TextEncoder().encode(json.delta.text));
          }
        } catch {
          /* ignore malformed lines */
        }
      }
    },
  });

  return { ok: true, stream: res.body.pipeThrough(transformer) };
}

// Synchronous (non-streaming) version — used when we want the full answer
// before doing anything else with it (e.g. for the Trade Coach).
export async function completeChat(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens = 800,
): Promise<{ ok: true; text: string } | { ok: false; reason: 'not_configured' | 'api_error'; detail?: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => 'unknown');
    return { ok: false, reason: 'api_error', detail: detail.slice(0, 500) };
  }

  const json = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (json.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');
  return { ok: true, text };
}
