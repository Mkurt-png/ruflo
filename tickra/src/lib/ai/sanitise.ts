// Boundary validation for anything a browser sends toward the model.
//
// `AiMessage` says `role: 'user' | 'assistant'`, but that is a compile-time
// promise about our own code. The request body is whatever the caller typed,
// and it was passed through unchecked. Two consequences:
//
//   1. A caller could send `{ role: 'system', … }`. On the Groq path those
//      messages are appended after our system prompt as further system
//      instructions — enough to switch off "never give buy/sell signals",
//      the one rule a trading-education site cannot afford to have bypassed.
//      `context.lessonTitle` went straight INTO the system prompt, so the same
//      thing was possible through a field meant to hold a lesson name.
//
//   2. Nothing bounded the size. The quota counts requests, not tokens, so a
//      single call could carry a whole context window of input.

import type { AiMessage } from './client';

export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 4_000;
export const MAX_TOTAL_CHARS = 24_000;
export const MAX_CONTEXT_CHARS = 120;

/**
 * Keep only well-formed user/assistant turns, most recent last, within the
 * size budget. Returns null when nothing usable remains or the conversation
 * does not end on a user turn — there is then nothing to answer.
 */
export function sanitiseMessages(raw: unknown): AiMessage[] | null {
  if (!Array.isArray(raw)) return null;

  const turns: AiMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    turns.push({ role, content: trimmed.slice(0, MAX_MESSAGE_CHARS) });
  }

  // Newest turns matter most: walk backwards until the budget is spent.
  const kept: AiMessage[] = [];
  let total = 0;
  for (let i = turns.length - 1; i >= 0 && kept.length < MAX_MESSAGES; i -= 1) {
    total += turns[i].content.length;
    if (total > MAX_TOTAL_CHARS) break;
    kept.unshift(turns[i]);
  }

  // Both providers expect the conversation to open and close on the user.
  while (kept.length > 0 && kept[0].role !== 'user') kept.shift();
  if (kept.length === 0 || kept[kept.length - 1].role !== 'user') return null;
  return kept;
}

/**
 * A short label (lesson or track title) that is interpolated into the system
 * prompt. One line, no quotes, bounded — it can name a lesson, and cannot
 * carry instructions of its own.
 */
export function clampContextField(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const flat = value.replace(/[\r\n\u2028\u2029"`]+/g, ' ').replace(/\s+/g, ' ').trim();
  return flat ? flat.slice(0, MAX_CONTEXT_CHARS) : null;
}

/** A finite number, or undefined. For numeric fields that are `.toFixed`-ed. */
export function finiteOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
