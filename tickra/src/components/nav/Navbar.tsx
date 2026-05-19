import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

export function Navbar({ dict, locale }: Props) {
  const links = [
    { href: `/${locale}#method`, label: dict.nav.method },
    { href: `/${locale}#curriculum`, label: dict.nav.curriculum },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-md">
      <Container as="div" className="flex h-16 items-center justify-between">
        <Link href={`/${locale}`} aria-label="Tickra" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Tickra</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher current={locale} label={dict.locale.switch} />
          </div>
          <ThemeToggle labelLight={dict.theme.light} labelDark={dict.theme.dark} />
          <Link
            href={`/${locale}/signin`}
            className="hidden text-sm text-muted transition-colors hover:text-ink md:inline"
          >
            {dict.nav.signIn}
          </Link>
          <Button href={`/${locale}/onboarding`}>{dict.nav.getStarted}</Button>
        </div>
      </Container>
    </header>
  );
}

function Logo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <rect x="4" y="9" width="3" height="10" rx="0.5" />
      <line x1="5.5" y1="5" x2="5.5" y2="9" />
      <line x1="5.5" y1="19" x2="5.5" y2="22" />
      <rect x="10.5" y="5" width="3" height="13" rx="0.5" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <rect x="17" y="11" width="3" height="7" rx="0.5" />
      <line x1="18.5" y1="7" x2="18.5" y2="11" />
      <line x1="18.5" y1="18" x2="18.5" y2="21" />
    </svg>
  );
}
