// Per-account scoping for client-side stores.
//
// Problem this solves: progress / XP / bookmarks / lesson notes used to
// live under fixed localStorage keys, so two different accounts signing
// in from the same browser shared one progression. Keys are now derived
// from the signed-in identity:
//
//   anonymous          →  legacy key unchanged ("tickra-progress-v1")
//   signed-in account  →  "tickra-progress-v1::u-<hash(email)>"
//
// The first account to sign in after this ships inherits the legacy
// (anonymous) data once — that preserves the original owner's work
// instead of resetting them. Every later account starts clean.
//
// `ScopeSync` (mounted in the locale layout) fetches /api/me and calls
// `setScopeFromEmail` on every page load; stores re-read on the
// "tickra-scope-changed" window event so a sign-in/sign-out swap is
// reflected without a reload.

const SCOPE_KEY = 'tickra-scope-v1';

export const SCOPE_EVENT = 'tickra-scope-changed';

// Legacy buckets that get a one-time copy into the first account's scope.
const MIGRATED_BASES = ['tickra-progress-v1', 'tickra-xp-v1', 'tickra-bookmarks-v1'];
const NOTE_PREFIX = 'tickra-note:';

function hashEmail(email: string): string {
  // djb2 — not cryptographic, just a stable short bucket id. The email
  // itself is never written to storage.
  let h = 5381;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `u-${h.toString(36)}`;
}

export function getScopeId(): string {
  if (typeof window === 'undefined') return 'anon';
  try {
    return window.localStorage.getItem(SCOPE_KEY) ?? 'anon';
  } catch {
    return 'anon';
  }
}

/** Key for the current scope. Anonymous keeps legacy keys untouched. */
export function scopedKey(base: string): string {
  const scope = getScopeId();
  return scope === 'anon' ? base : `${base}::${scope}`;
}

function migrateLegacyInto(scope: string) {
  // One-time copy of anonymous data into the first signed-in account.
  try {
    const marker = `tickra-scope-migrated::${scope}`;
    if (window.localStorage.getItem(marker)) return;
    const legacyClaimed = window.localStorage.getItem('tickra-scope-legacy-claimed');
    if (!legacyClaimed) {
      for (const base of MIGRATED_BASES) {
        const legacy = window.localStorage.getItem(base);
        if (legacy && !window.localStorage.getItem(`${base}::${scope}`)) {
          window.localStorage.setItem(`${base}::${scope}`, legacy);
        }
      }
      // Notes: copy every un-scoped lesson note.
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(NOTE_PREFIX) && !k.includes('::')) {
          const v = window.localStorage.getItem(k);
          if (v && !window.localStorage.getItem(`${k}::${scope}`)) {
            window.localStorage.setItem(`${k}::${scope}`, v);
          }
        }
      }
      window.localStorage.setItem('tickra-scope-legacy-claimed', scope);
    }
    window.localStorage.setItem(marker, '1');
  } catch {
    /* private mode — degrade silently */
  }
}

/** Called by ScopeSync whenever the session identity is known. */
export function setScopeFromEmail(email: string | null) {
  if (typeof window === 'undefined') return;
  const next = email ? hashEmail(email) : 'anon';
  const current = getScopeId();
  if (next === current) return;
  try {
    if (next === 'anon') window.localStorage.removeItem(SCOPE_KEY);
    else window.localStorage.setItem(SCOPE_KEY, next);
    if (next !== 'anon') migrateLegacyInto(next);
    // Reset per-session server-sync flags so the new account pulls its
    // own server-side progress/bookmarks instead of skipping the fetch.
    window.sessionStorage.removeItem('tickra-progress-server-synced-v1');
    window.sessionStorage.removeItem('tickra-bookmarks-server-synced-v1');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SCOPE_EVENT));
}
