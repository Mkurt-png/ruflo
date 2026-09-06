// TICKRA-PHASE-2.1: thin AI client. Originally Anthropic-only; now defaults
// to Groq (free hosted Llama 3.3 70B, OpenAI-compatible API) and falls back
// to Anthropic if only ANTHROPIC_API_KEY is set. Same exported shape — every
// caller (AskNow, Trade Coach, debug probe) keeps working unchanged.
//
// Env (any single one activates AI):
//   GROQ_API_KEY        gsk_…       (preferred — free tier, 15 req/min)
//   GROQ_MODEL                       (optional, defaults to llama-3.3-70b-versatile)
//   ANTHROPIC_API_KEY   sk-ant-…    (fallback)
//   ANTHROPIC_MODEL                  (optional, defaults to claude-3-5-haiku-20241022)
//
// Without either, callers receive { reason: 'not_configured' } and surface a
// graceful "AI is currently offline" message.

const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const ANTHROPIC_DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

export type AiMessage = { role: 'user' | 'assistant'; content: string };

export type AiResult =
  | { ok: true; stream: ReadableStream<Uint8Array> }
  | { ok: false; reason: 'not_configured' | 'api_error'; detail?: string };

type Provider = 'groq' | 'anthropic';

function pickProvider(): Provider | null {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

// ── Streaming ────────────────────────────────────────────────────────────

export async function streamChat(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens = 800,
): Promise<AiResult> {
  const provider = pickProvider();
  if (!provider) return { ok: false, reason: 'not_configured' };
  return provider === 'groq'
    ? streamGroq(systemPrompt, messages, maxTokens)
    : streamAnthropic(systemPrompt, messages, maxTokens);
}

async function streamGroq(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<AiResult> {
  const key = process.env.GROQ_API_KEY!;
  const model = process.env.GROQ_MODEL ?? GROQ_DEFAULT_MODEL;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => 'unknown');
    return { ok: false, reason: 'api_error', detail: detail.slice(0, 500) };
  }

  // OpenAI-compatible SSE → plain text deltas.
  const transformer = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(new TextEncoder().encode(delta));
        } catch {
          /* ignore malformed lines */
        }
      }
    },
  });

  return { ok: true, stream: res.body.pipeThrough(transformer) };
}

async function streamAnthropic(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<AiResult> {
  const key = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL ?? ANTHROPIC_DEFAULT_MODEL;
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
          if (
            json.type === 'content_block_delta' &&
            json.delta?.type === 'text_delta' &&
            json.delta.text
          ) {
            controller.enqueue(new TextEncoder().encode(json.delta.text));
          }
        } catch {
          /* ignore */
        }
      }
    },
  });

  return { ok: true, stream: res.body.pipeThrough(transformer) };
}

// ── Non-streaming (Trade Coach) ─────────────────────────────────────────

export async function completeChat(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens = 800,
): Promise<
  | { ok: true; text: string }
  | { ok: false; reason: 'not_configured' | 'api_error'; detail?: string }
> {
  const provider = pickProvider();
  if (!provider) return { ok: false, reason: 'not_configured' };
  return provider === 'groq'
    ? completeGroq(systemPrompt, messages, maxTokens)
    : completeAnthropic(systemPrompt, messages, maxTokens);
}

async function completeGroq(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<
  | { ok: true; text: string }
  | { ok: false; reason: 'api_error'; detail?: string }
> {
  const key = process.env.GROQ_API_KEY!;
  const model = process.env.GROQ_MODEL ?? GROQ_DEFAULT_MODEL;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => 'unknown');
    return { ok: false, reason: 'api_error', detail: detail.slice(0, 500) };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? '';
  return { ok: true, text };
}

async function completeAnthropic(
  systemPrompt: string,
  messages: AiMessage[],
  maxTokens: number,
): Promise<
  | { ok: true; text: string }
  | { ok: false; reason: 'api_error'; detail?: string }
> {
  const key = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL ?? ANTHROPIC_DEFAULT_MODEL;
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
