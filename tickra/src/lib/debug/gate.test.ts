import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDebugAuthorised } from './gate';

const reqWith = (headers: Record<string, string> = {}) =>
  new Request('https://tickra.app/api/debug/env', { headers });

const ORIGINAL = { VERCEL: process.env.VERCEL, DEBUG_TOKEN: process.env.DEBUG_TOKEN };

beforeEach(() => {
  delete process.env.VERCEL;
  delete process.env.DEBUG_TOKEN;
});

afterEach(() => {
  if (ORIGINAL.VERCEL === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = ORIGINAL.VERCEL;
  if (ORIGINAL.DEBUG_TOKEN === undefined) delete process.env.DEBUG_TOKEN;
  else process.env.DEBUG_TOKEN = ORIGINAL.DEBUG_TOKEN;
});

describe('isDebugAuthorised — local development', () => {
  it('is open when not running on Vercel', () => {
    expect(isDebugAuthorised(reqWith()).ok).toBe(true);
  });
});

describe('isDebugAuthorised — Vercel deployments', () => {
  it('denies preview deployments without a token (the regression we fixed)', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    expect(isDebugAuthorised(reqWith()).ok).toBe(false);
  });

  it('denies when DEBUG_TOKEN is not configured, even with a header', () => {
    process.env.VERCEL = '1';
    expect(isDebugAuthorised(reqWith({ 'x-debug-token': 'anything' })).ok).toBe(false);
  });

  it('denies when the header is missing', () => {
    process.env.VERCEL = '1';
    process.env.DEBUG_TOKEN = 'super-secret';
    expect(isDebugAuthorised(reqWith()).ok).toBe(false);
  });

  it('denies a wrong token', () => {
    process.env.VERCEL = '1';
    process.env.DEBUG_TOKEN = 'super-secret';
    expect(isDebugAuthorised(reqWith({ 'x-debug-token': 'wrong-secret' })).ok).toBe(false);
  });

  it('denies a token that merely shares a prefix', () => {
    process.env.VERCEL = '1';
    process.env.DEBUG_TOKEN = 'super-secret';
    expect(isDebugAuthorised(reqWith({ 'x-debug-token': 'super' })).ok).toBe(false);
  });

  it('allows the exact token', () => {
    process.env.VERCEL = '1';
    process.env.DEBUG_TOKEN = 'super-secret';
    expect(isDebugAuthorised(reqWith({ 'x-debug-token': 'super-secret' })).ok).toBe(true);
  });

  it('requires the token in production too', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.DEBUG_TOKEN = 'super-secret';
    expect(isDebugAuthorised(reqWith()).ok).toBe(false);
    expect(isDebugAuthorised(reqWith({ 'x-debug-token': 'super-secret' })).ok).toBe(true);
  });
});
