'use client';

import Link from 'next/link';
import { useUser } from '@/lib/auth/useUser';

type Props = { locale: string; signInLabel: string; accountLabel: string };

export function UserMenu({ locale, signInLabel, accountLabel }: Props) {
  const { user, ready } = useUser();

  if (!ready) {
    return <span aria-hidden className="h-4 w-16 rounded-full bg-line/60" />;
  }

  if (user) {
    return (
      <Link
        href={`/${locale}/me`}
        className="hidden text-sm text-ink transition-colors hover:text-muted md:inline"
      >
        {accountLabel}
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/signin`}
      className="hidden text-sm text-muted transition-colors hover:text-ink md:inline"
    >
      {signInLabel}
    </Link>
  );
}
