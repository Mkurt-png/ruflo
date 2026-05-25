import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// GET /api/me — returns current user from the session cookie, or null.
export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { email: session.email } });
}
