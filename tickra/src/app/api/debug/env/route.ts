import { NextResponse } from 'next/server';

// Per-request: env vars can change between deploys.
export const dynamic = 'force-dynamic';

// GET /api/_debug/env
// Returns presence + length only — never the actual values. Safe to leave
// public for quick diagnostics; remove once everything is wired and verified.

function info(name: string) {
  const v = process.env[name];
  return {
    present: typeof v === 'string',
    length: typeof v === 'string' ? v.length : 0,
    blank: typeof v === 'string' && v.trim().length === 0,
  };
}

export async function GET() {
  return NextResponse.json({
    runtime: process.env.VERCEL ? 'vercel' : 'local',
    vercelEnv: process.env.VERCEL_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    vars: {
      SUPABASE_URL: info('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: info('SUPABASE_SERVICE_ROLE_KEY'),
      AUTH_SIGNING_SECRET: info('AUTH_SIGNING_SECRET'),
    },
  });
}
