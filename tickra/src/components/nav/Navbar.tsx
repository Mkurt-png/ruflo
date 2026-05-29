import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';
import { ExploreMenu } from './ExploreMenu';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

export function Navbar({ dict, locale }: Props) {
  const links = [
    { href: `/${locale}/learn`, label: dict.nav.learn },
    { href: `/${locale}#method`, label: dict.nav.method },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
  ];

  // TICKRA-DESIGN: surface secondary discovery pages from the navbar
  // instead of leaving them buried in the footer only.
  // TICKRA-SPRINT-B: simulator entry exposed here too (Pro-gated inside).
  const exploreItems = [
    { href: `/${locale}/me/simulator`, label: dict.nav.simulator },
    { href: `/${locale}/editorial`, label: dict.nav.editorial },
    { href: `/${locale}/glossary`, label: dict.nav.glossary },
    { href: `/${locale}/about`, label: dict.nav.about },
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
            <li>
              <ExploreMenu label={dict.nav.explore} items={exploreItems} />
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <CommandHint />
          <div className="hidden sm:block">
            <LocaleSwitcher current={locale} label={dict.locale.switch} />
          </div>
          <ThemeToggle labelLight={dict.theme.light} labelDark={dict.theme.dark} />
          <UserMenu
            locale={locale}
            signInLabel={dict.nav.signIn}
            accountLabel={locale === 'fr' ? 'Mon compte' : 'My account'}
          />
          <div className="hidden md:block">
            <Button href={`/${locale}/onboarding`}>{dict.nav.getStarted}</Button>
          </div>
          <MobileMenu dict={dict} locale={locale} links={links} />
        </div>
      </Container>
    </header>
  );
}

function CommandHint() {
  // Visual hint — does not need to be a real button, the global ⌘K listener
  // in CommandPalette handles the actual open. Hidden on mobile for room.
  return (
    <span
      aria-hidden
      className="hidden h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted md:inline-flex"
    >
      <kbd className="font-mono text-[11px]">⌘</kbd>
      <kbd className="font-mono text-[11px]">K</kbd>
    </span>
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
