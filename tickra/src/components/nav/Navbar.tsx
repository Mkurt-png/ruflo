import Link from 'next/link';
import { LocaleSwitcher } from './LocaleSwitcher';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';
import { ExploreMenu } from './ExploreMenu';
import { ScrollProgressBar } from './ScrollProgressBar';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

// TICKRA-REDESIGN: Premium Navy navbar — navy-950 sticky + scroll progress + accent-blue CTA.
export function Navbar({ dict, locale }: Props) {
  const links = [
    { href: `/${locale}/learn`, label: dict.nav.learn },
    { href: `/${locale}#method`, label: dict.nav.method },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
  ];

  const exploreItems = [
    { href: `/${locale}/criee`, label: locale === 'fr' ? 'La Criée' : 'La Criée' },
    { href: `/${locale}/me/simulator`, label: dict.nav.simulator },
    { href: `/${locale}/battle`, label: dict.nav.battle },
    { href: `/${locale}/leaderboard`, label: locale === 'fr' ? 'Classement' : 'Leaderboard' },
    { href: `/${locale}/journal`, label: locale === 'fr' ? 'Journal' : 'Journal' },
    { href: `/${locale}/lettre`, label: locale === 'fr' ? 'La Lettre' : 'The Letter' },
    { href: `/${locale}/survie`, label: locale === 'fr' ? 'Survie' : 'Survival' },
    { href: `/${locale}/achievements`, label: locale === 'fr' ? 'Succès' : 'Achievements' },
    { href: `/${locale}/community`, label: dict.nav.communityLink },
    { href: `/${locale}/editorial`, label: dict.nav.editorial },
    { href: `/${locale}/glossary`, label: dict.nav.glossary },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="relative mx-auto w-full max-w-container px-6 md:px-10 flex h-16 items-center justify-between">
        <Link href={`/${locale}`} aria-label="Tickra" className="flex items-center gap-2.5 text-white">
          <Logo />
          <span className="text-[15px] font-medium tracking-tight">Tickra</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
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
          <div className="hidden sm:block">
            <LocaleSwitcher current={locale} label={dict.locale.switch} />
          </div>
          <UserMenu
            locale={locale}
            signInLabel={dict.nav.signIn}
            accountLabel={locale === 'fr' ? 'Mon compte' : 'My account'}
          />
          <div className="hidden md:block">
            <Link
              href={`/${locale}/onboarding`}
              className="inline-flex items-center bg-brand text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
            >
              {dict.nav.getStarted}
            </Link>
          </div>
          <MobileMenu dict={dict} locale={locale} links={links} />
        </div>

        <ScrollProgressBar />
      </div>
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
