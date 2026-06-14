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

// Tickra uses four Inter weights total (regular, medium, semibold, bold).
// Pinning the request avoids fetching the eight-weight variable Inter
// file Next would otherwise serve by default.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});
// JetBrains Mono is only used for editorial captions / kbd / code at
// regular weight. Pinning to 400 avoids the full eight-weight family.
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400'],
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
      dir="ltr"
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
        {/* install offline support + show "Add to home screen" prompt. */}
        <ServiceWorkerRegister />
        <InstallPrompt locale={locale} />
        {/* contextual mobile sticky CTA, available on every page. */}
        <MobileStickyCta
          href={`/${locale}/onboarding`}
          label={dict.stickyCta.label}
        />
        {/* floating IA assistant. Hidden on signin/onboarding/welcome. */}
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
