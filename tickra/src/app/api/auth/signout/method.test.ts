import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Signing out must never be reachable by GET.
//
// It was, and the consequence was not theoretical: the command palette listed
// "Sign out" as a Next <Link>, Next prefetches links as they scroll into view,
// and the sign-out row is always among the first results — so pressing ⌘K
// silently cleared the session cookie. Any <img src>, link-preview bot or
// crawler hitting the URL had the same effect.

const ROUTE = resolve(__dirname, 'route.ts');
const PALETTE = resolve(__dirname, '../../../../components/site/CommandPalette.tsx');

describe('sign-out is POST-only', () => {
  it('the route exports POST and not GET', () => {
    const src = readFileSync(ROUTE, 'utf8');
    expect(src).toMatch(/export const POST\b/);
    expect(src).not.toMatch(/export const GET\b/);
    expect(src).not.toMatch(/export async function GET\b/);
  });

  it('no component links to the sign-out endpoint with an href', () => {
    const src = readFileSync(PALETTE, 'utf8');
    // A form action is fine (it POSTs); an href is not (it GETs, and prefetches).
    expect(src).not.toMatch(/href[=:]\s*['"`][^'"`]*api\/auth\/signout/);
  });
});
