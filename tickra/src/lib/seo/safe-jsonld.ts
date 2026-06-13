// Shared JSON-LD escape helper. Every JsonLd component in this repo
// embeds a JSON.stringify payload inside a <script type="application/ld+json">
// block. JSON.stringify alone does not handle three breakout vectors:
//   1. A literal "</script>" inside a string value
//   2. U+2028 (LINE SEPARATOR) which is a valid JSON char but terminates
//      a JS string inside a <script> block — breaks parsing in older engines
//   3. U+2029 (PARAGRAPH SEPARATOR) — same as U+2028
//
// We also escape `<`, `>`, `&` defensively so the rendered <script> body
// cannot host a nested tag or entity-decode trick.
//
// This is defence-in-depth: most callers today pass string literals, but
// dictionary entries and user-supplied content slip into payloads over
// time. Centralising the escape makes the surface auditable.
export function safeJsonLd(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');
}
