import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { themeInitScript } from '@/lib/theme/script';
import { buildMetadata } from '@/lib/seo';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { CookieBanner } from '@/components/site/CookieBanner';
import { Analytics } from '@/components/site/Analytics';
import { ToastProvider } from '@/components/site/ToastProvider';
import { CommandPalette } from '@/components/site/CommandPalette';
import { ServiceWorkerRegister } from '@/components/site/ServiceWorkerRegister';
import { InstallPrompt } from '@/components/site/InstallPrompt';
import { MobileStickyCta } from '@/components/site/MobileStickyCta';
import { AskTickra } from '@/components/ai/AskTickra';
import { ScopeSync } from '@/components/site/ScopeSync';
import { HeurePapier } from '@/components/site/HeurePapier';
import { ExitIntentModal } from '@/components/site/ExitIntentModal';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return buildMetadata(params.locale);
}

// Tells the browser chrome (mobile status bar, PWA chrome, Safari) to
// paint in the editorial palette: ivory in light mode, ink in dark.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0E0E' },
  ],
  colorScheme: 'light dark',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Global Organization JSON-LD — helps Google rich results + LLM citations. */}
        <OrganizationJsonLd />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
        >
          {locale === 'fr' ? 'Aller au contenu' : 'Skip to content'}
        </a>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        {/* Bind localStorage stores (progress/XP/bookmarks/notes) to the
            signed-in account so two accounts on one browser don't share
            a progression. */}
        <ScopeSync />
        <HeurePapier />
        <CommandPalette locale={locale} />
        {/* TICKRA-PHASE-6: install offline support + show "Add to home screen" prompt. */}
        <ServiceWorkerRegister />
        <InstallPrompt locale={locale} />
        {/* TICKRA-PHASE-6: contextual mobile sticky CTA, available on every page. */}
        <MobileStickyCta
          href={`/${locale}/onboarding`}
          label={dict.stickyCta.label}
        />
        {/* TICKRA-PHASE-2.1: floating IA assistant. Hidden on signin/onboarding/welcome. */}
        <AskTickra locale={locale} />
        <Analytics />
        <CookieBanner
          locale={locale}
          title={dict.cookies.title}
          body={dict.cookies.body}
          accept={dict.cookies.accept}
          reject={dict.cookies.reject}
          learnMore={dict.cookies.learnMore}
        />
        {/* Lead capture on exit intent — one-shot per session, never on
            in-funnel surfaces (signin/onboarding/learn/me). */}
        <ExitIntentModal locale={locale} />
      </body>
    </html>
  );
}
