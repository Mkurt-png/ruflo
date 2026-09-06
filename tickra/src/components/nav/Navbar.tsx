import Link from 'next/link';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ManuscritToggle } from '@/components/site/ManuscritToggle';
import { MobileMenu } from './MobileMenu';
import { UserMenu } from './UserMenu';
import { ExploreMenu } from './ExploreMenu';
import { ScrollProgressBar } from './ScrollProgressBar';
import { LogoMark, Wordmark } from '@/components/brand/Logo';
import { BRAND_NAME } from '@/lib/brand';
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
    { href: `/${locale}/maison`, label: locale === 'fr' ? 'La Maison · plan' : 'The House · plan' },
    { href: `/${locale}/criee`, label: locale === 'fr' ? 'La Criée' : 'La Criée' },
    { href: `/${locale}/lettre`, label: locale === 'fr' ? 'La Lettre' : 'The Letter' },
    { href: `/${locale}/veillee`, label: locale === 'fr' ? 'La Veillée' : 'The Vigil' },
    { href: `/${locale}/journal`, label: locale === 'fr' ? 'Journal' : 'Journal' },
    { href: `/${locale}/survie`, label: locale === 'fr' ? 'Survie' : 'Survival' },
    { href: `/${locale}/me/simulator`, label: dict.nav.simulator },
    { href: `/${locale}/battle`, label: dict.nav.battle },
    { href: `/${locale}/leaderboard`, label: locale === 'fr' ? 'Classement' : 'Leaderboard' },
    { href: `/${locale}/community`, label: dict.nav.communityLink },
    { href: `/${locale}/editorial`, label: dict.nav.editorial },
    { href: `/${locale}/glossary`, label: dict.nav.glossary },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-canvas/50">
      <div className="relative mx-auto w-full max-w-container px-6 md:px-10 flex h-16 items-center justify-between">
        <Link href={`/${locale}`} aria-label={BRAND_NAME} className="flex items-center gap-2.5 text-ink">
          <LogoMark />
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-muted transition-colors hover:text-ink"
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
            <ManuscritToggle locale={locale} />
          </div>
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
              className="inline-flex items-center rounded-full bg-[linear-gradient(110deg,rgb(var(--brand)),rgb(var(--glow)))] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(var(--glow)/0.7)] transition-all hover:-translate-y-0.5 hover:brightness-110"
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

