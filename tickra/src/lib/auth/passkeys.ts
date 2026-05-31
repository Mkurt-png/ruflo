// Server-side WebAuthn / Passkey helpers.
//
// Wraps @simplewebauthn/server with our project conventions: lazy import so
// missing package gracefully degrades, env-driven rpID / rpName / origin, and
// challenge persistence via a short-lived httpOnly cookie. We never trust
// client-side challenge state.
//
// All public-key + credential-id encoding is base64url throughout.

import { cookies } from 'next/headers';

export const CHALLENGE_COOKIE = 'tickra-webauthn-challenge';
const CHALLENGE_TTL_SECONDS = 5 * 60; // 5 minutes — generous for slow USB keys

export type RpConfig = {
  rpID: string;
  rpName: string;
  origin: string;
};

export function getRpConfig(): RpConfig {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tickra1.vercel.app';
  let host = 'tickra1.vercel.app';
  let origin = siteUrl.replace(/\/$/, '');
  try {
    const url = new URL(siteUrl);
    host = url.hostname;
    origin = `${url.protocol}//${url.host}`;
  } catch {
    /* fall through to defaults */
  }
  return { rpID: host, rpName: 'Tickra', origin };
}

// Lazy loader — returns null if package isn't installed. Routes turn that
// into HTTP 501 not_configured (same pattern as the rest of the project).
type WebAuthnModule = typeof import('@simplewebauthn/server');
let cachedModule: WebAuthnModule | null = null;
let triedLoad = false;

async function loadModule(): Promise<WebAuthnModule | null> {
  if (cachedModule) return cachedModule;
  if (triedLoad) return null;
  triedLoad = true;
  try {
    cachedModule = (await import('@simplewebauthn/server')) as WebAuthnModule;
    return cachedModule;
  } catch {
    return null;
  }
}

export async function isWebAuthnAvailable(): Promise<boolean> {
  return (await loadModule()) !== null;
}

// ─── Challenge cookie ────────────────────────────────────────────────────

function setChallengeCookie(challenge: string): void {
  cookies().set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

function readChallengeCookie(): string | null {
  return cookies().get(CHALLENGE_COOKIE)?.value ?? null;
}

function clearChallengeCookie(): void {
  cookies().set(CHALLENGE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ─── Registration ─────────────────────────────────────────────────────────

export type GeneratedRegistrationOptions = Awaited<
  ReturnType<WebAuthnModule['generateRegistrationOptions']>
>;

export async function generateRegistrationOptions(args: {
  email: string;
  existingCredentialIds: string[];
}): Promise<GeneratedRegistrationOptions | null> {
  const mod = await loadModule();
  if (!mod) return null;
  const { rpID, rpName } = getRpConfig();

  // userID for WebAuthn must be a stable opaque byte sequence per user. The
  // email is stable enough for our use case; we hash-free encode it.
  const userID = new TextEncoder().encode(args.email);

  const options = await mod.generateRegistrationOptions({
    rpName,
    rpID,
    userID,
    userName: args.email,
    userDisplayName: args.email,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    excludeCredentials: args.existingCredentialIds.map((id) => ({ id })),
  });

  setChallengeCookie(options.challenge);
  return options;
}

export type VerifiedRegistration = {
  ok: true;
  credentialId: string;
  publicKey: string; // base64url
  counter: number;
  transports?: string[];
} | {
  ok: false;
  reason: string;
};

export async function verifyRegistration(args: {
  // SimpleWebAuthn's RegistrationResponseJSON — typed loosely so we don't
  // re-export the type and create coupling.
  response: unknown;
}): Promise<VerifiedRegistration> {
  const mod = await loadModule();
  if (!mod) return { ok: false, reason: 'not_configured' };
  const { rpID, origin } = getRpConfig();
  const expectedChallenge = readChallengeCookie();
  if (!expectedChallenge) return { ok: false, reason: 'missing_challenge' };

  try {
    const verification = await mod.verifyRegistrationResponse({
      // Cast — the route validates shape upstream.
      response: args.response as Parameters<typeof mod.verifyRegistrationResponse>[0]['response'],
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    clearChallengeCookie();

    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, reason: 'not_verified' };
    }

    const info = verification.registrationInfo;
    // SimpleWebAuthn v11 exposes `credential.{id, publicKey, counter}`.
    // Fall back to legacy `credentialID` / `credentialPublicKey` if present.
    const credentialId: string | undefined =
      (info as { credential?: { id?: string } }).credential?.id ??
      ((info as { credentialID?: unknown }).credentialID as string | undefined);
    const publicKeyRaw: Uint8Array | undefined =
      (info as { credential?: { publicKey?: Uint8Array } }).credential?.publicKey ??
      ((info as { credentialPublicKey?: Uint8Array }).credentialPublicKey as Uint8Array | undefined);
    const counter: number =
      (info as { credential?: { counter?: number } }).credential?.counter ??
      ((info as { counter?: number }).counter ?? 0);

    if (!credentialId || !publicKeyRaw) return { ok: false, reason: 'incomplete_registration' };

    const publicKey = Buffer.from(publicKeyRaw).toString('base64url');
    const transports =
      (args.response as { response?: { transports?: string[] } }).response?.transports;

    return {
      ok: true,
      credentialId,
      publicKey,
      counter,
      transports,
    };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'verify_failed' };
  }
}

// ─── Authentication ───────────────────────────────────────────────────────

export type GeneratedAuthenticationOptions = Awaited<
  ReturnType<WebAuthnModule['generateAuthenticationOptions']>
>;

export async function generateAuthenticationOptions(args: {
  allowCredentialIds: string[];
}): Promise<GeneratedAuthenticationOptions | null> {
  const mod = await loadModule();
  if (!mod) return null;
  const { rpID } = getRpConfig();
  const options = await mod.generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: args.allowCredentialIds.map((id) => ({ id })),
  });
  setChallengeCookie(options.challenge);
  return options;
}

export type VerifiedAuthentication = {
  ok: true;
  credentialId: string;
  newCounter: number;
} | {
  ok: false;
  reason: string;
};

export async function verifyAuthentication(args: {
  response: unknown;
  credential: { credential_id: string; public_key: string; counter: number; transports: string | null };
}): Promise<VerifiedAuthentication> {
  const mod = await loadModule();
  if (!mod) return { ok: false, reason: 'not_configured' };
  const { rpID, origin } = getRpConfig();
  const expectedChallenge = readChallengeCookie();
  if (!expectedChallenge) return { ok: false, reason: 'missing_challenge' };

  const publicKey = Buffer.from(args.credential.public_key, 'base64url');
  const transports = args.credential.transports
    ? (args.credential.transports.split(',').filter(Boolean) as string[])
    : undefined;

  try {
    // SimpleWebAuthn v11 takes `credential: { id, publicKey, counter, transports? }`.
    // Older releases used `authenticator: { credentialID, credentialPublicKey, counter }`.
    // We pass both shapes via an `any` cast so this code compiles against either.
    const verifyArgs: Record<string, unknown> = {
      response: args.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: args.credential.credential_id,
        publicKey,
        counter: args.credential.counter,
        transports,
      },
      authenticator: {
        credentialID: args.credential.credential_id,
        credentialPublicKey: publicKey,
        counter: args.credential.counter,
        transports,
      },
    };

    const verification = await mod.verifyAuthenticationResponse(
      verifyArgs as unknown as Parameters<typeof mod.verifyAuthenticationResponse>[0],
    );

    clearChallengeCookie();

    if (!verification.verified) return { ok: false, reason: 'not_verified' };

    const newCounter =
      (verification as { authenticationInfo?: { newCounter?: number } }).authenticationInfo
        ?.newCounter ?? args.credential.counter;

    return { ok: true, credentialId: args.credential.credential_id, newCounter };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'verify_failed' };
  }
}

// ─── Session cookie (same shape as magic-link callback) ──────────────────

export function buildSessionCookieValue(email: string, ttlSeconds: number): {
  value: string;
  maxAge: number;
} | null {
  const secret = process.env.AUTH_SIGNING_SECRET;
  if (!secret) return null;
  // Inline imports to keep the module tree-shakeable on the client side guards.
  // We're in a server module; require('node:crypto') is safe.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require('node:crypto') as typeof import('node:crypto');
  const payload = `${email}.${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  const value = `${Buffer.from(payload).toString('base64url')}.${sig}`;
  return { value, maxAge: ttlSeconds };
}
