import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { pageMeta } from '@/lib/seo/page-meta';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { ShimmerButton } from '@/components/fx/ShimmerButton';
import { MagneticTilt } from '@/components/fx/MagneticTilt';
import { CursorGlow } from '@/components/fx/CursorGlow';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return {};
  return pageMeta({
    slug: 'brand',
    locale: params.locale,
    title: params.locale === 'fr' ? 'Marque' : 'Brand',
    description:
      params.locale === 'fr'
        ? 'Le manuel de marque Tickra : palette, typographie, voix.'
        : 'Tickra’s brand manual: palette, typography, voice.',
  });
}

// /brand — visual style guide. Shows palette, type ramp, signature effects
// and the building blocks every section reuses. Acts as a QA surface for
// designers and developers to verify tokens stay consistent across pages.

const PALETTE: { name: string; cssVar: string; hexLight: string; hexDark: string; role: string }[] = [
  { name: 'Brand',    cssVar: '--brand',    hexLight: '#00D26A', hexDark: '#00E676', role: 'Primary actions, "up" trades, brand surfaces' },
  { name: 'Up',       cssVar: '--up',       hexLight: '#00D26A', hexDark: '#00E676', role: 'Gains, positive deltas, bull signals' },
  { name: 'Down',     cssVar: '--down',     hexLight: '#FF4D4F', hexDark: '#FF6366', role: 'Losses, negative deltas, bear signals' },
  { name: 'Accent',   cssVar: '--accent',   hexLight: '#DCFCE7', hexDark: '#0F3523', role: 'Selection, highlights, soft glows' },
  { name: 'Ink',      cssVar: '--ink',      hexLight: '#0A0A0A', hexDark: '#FAFAFA', role: 'Body text, secondary CTAs' },
  { name: 'Canvas',   cssVar: '--canvas',   hexLight: '#FAFAFA', hexDark: '#0A0A0A', role: 'Page background' },
  { name: 'Surface',  cssVar: '--surface',  hexLight: '#FFFFFF', hexDark: '#141414', role: 'Card background' },
  { name: 'Line',     cssVar: '--line',     hexLight: '#E5E7EB', hexDark: '#27272A', role: 'Dividers, borders' },
];

export default async function BrandPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = await getDictionary(locale);

  const title = locale === 'fr' ? 'Charte graphique' : 'Brand system';
  const body =
    locale === 'fr'
      ? 'Palette, typographie, effets signature et composants de référence. Source de vérité pour toute nouvelle surface.'
      : 'Palette, typography, signature effects and reference components. Source of truth for every new surface.';

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main">
        <PageHero eyebrow={locale === 'fr' ? 'Design system' : 'Design system'} title={title} body={body} />

        {/* PALETTE */}
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <SectionTitle eyebrow="01 · Palette" title={locale === 'fr' ? 'Couleurs sémantiques' : 'Semantic colors'} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8">
              {PALETTE.map((c) => (
                <div key={c.name} className="rounded-xl border border-line overflow-hidden bg-surface">
                  <div
                    className="h-24 w-full"
                    style={{ background: `rgb(var(${c.cssVar}))` }}
                    aria-hidden
                  />
                  <div className="p-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{c.cssVar}</div>
                    <div className="mt-1 font-medium text-ink">{c.name}</div>
                    <div className="mt-1 text-[12px] text-muted">{c.role}</div>
                    <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[10px] text-subtle">
                      <span>L {c.hexLight}</span>
                      <span>D {c.hexDark}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* TYPOGRAPHY */}
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <SectionTitle eyebrow="02 · Type" title={locale === 'fr' ? 'Échelle typographique' : 'Type ramp'} />
            <div className="mt-8 space-y-6">
              <TypeSpec
                label="display-xl · Fraunces"
                sample={locale === 'fr' ? 'Tradez avec rigueur.' : 'Trade with rigor.'}
                className="font-display text-display-xl"
              />
              <TypeSpec
                label="display-lg · Fraunces"
                sample={locale === 'fr' ? 'Une école pour les marchés.' : 'A school for markets.'}
                className="font-display text-display-lg"
              />
              <TypeSpec
                label="display-md · Fraunces"
                sample={locale === 'fr' ? 'Discipline et conviction.' : 'Discipline and conviction.'}
                className="font-display text-display-md"
              />
              <TypeSpec
                label="body · Inter"
                sample={locale === 'fr' ? 'Le texte courant respire avec une largeur lisible et un interligne posé.' : 'Body copy breathes with comfortable line length and calm leading.'}
                className="font-sans text-[16px] leading-relaxed text-muted"
              />
              <TypeSpec
                label="mono · JetBrains"
                sample="LIVE · BTC 67 432.18 · +1.42%"
                className="font-mono text-[14px] tracking-[0.05em] tabular-nums text-brand"
              />
            </div>
          </Container>
        </section>

        {/* SIGNATURE EFFECTS */}
        <section className="relative bg-black text-white border-b border-white/10 overflow-hidden">
          <CursorGlow />
          <div aria-hidden className="pointer-events-none absolute inset-0 noise opacity-30" />
          <div className="relative z-10">
            <Container as="div" className="py-16 md:py-24">
              <SectionTitle
                eyebrow="03 · Effects"
                title={locale === 'fr' ? 'Effets signature' : 'Signature effects'}
                onDark
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                <EffectCard
                  title="Holographic text"
                  desc={locale === 'fr' ? 'Sweep emerald → mint → aqua sur le mot clé du titre.' : 'Emerald → mint → aqua sweep on headline keywords.'}
                >
                  <div className="font-display text-4xl font-medium tracking-tight">
                    <span className="holo-text">conviction</span>
                  </div>
                </EffectCard>

                <EffectCard
                  title="Shimmer button"
                  desc={locale === 'fr' ? 'Sweep diagonal premium sur les CTA principaux.' : 'Diagonal premium sweep on primary CTAs.'}
                >
                  <ShimmerButton href={`/${locale}/pricing`}>
                    {locale === 'fr' ? 'Voir l’offre' : 'See the offer'}
                  </ShimmerButton>
                </EffectCard>

                <EffectCard
                  title="Gradient border"
                  desc={locale === 'fr' ? 'Bord conique 1px qui tourne autour de la carte.' : 'Conic 1px border rotating around the card.'}
                >
                  <div className="gradient-border-brand rounded-xl">
                    <div className="rounded-xl bg-black px-5 py-4 text-sm text-white/80">
                      Premium · Lifetime
                    </div>
                  </div>
                </EffectCard>

                <EffectCard
                  title="Magnetic tilt"
                  desc={locale === 'fr' ? 'Tilt 3D suivant le curseur sur les cartes hautes-valeurs.' : 'Cursor-tracking 3D tilt on high-value cards.'}
                >
                  <MagneticTilt>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-6 text-sm">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">Pro</div>
                      <div className="mt-1 text-white">14,99 € / mois</div>
                    </div>
                  </MagneticTilt>
                </EffectCard>

                <EffectCard
                  title="Scanlines"
                  desc={locale === 'fr' ? 'Overlay CRT subtil pour les panneaux terminal.' : 'Subtle CRT overlay for terminal panels.'}
                >
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black px-5 py-6 text-sm">
                    <div className="absolute inset-0 scanlines opacity-60" aria-hidden />
                    <div className="relative font-mono text-[12px] text-brand">$ tickra --live</div>
                    <div className="relative font-mono text-[12px] text-white/60 mt-1">connected · streaming</div>
                  </div>
                </EffectCard>

                <EffectCard
                  title="Brand glow"
                  desc={locale === 'fr' ? 'Halo coloré pour signaler une valeur up / down / brand.' : 'Coloured halo to flag up / down / brand values.'}
                >
                  <div className="flex gap-3">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-up/20 text-up font-mono text-sm shadow-glow-up">+</span>
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-down/20 text-down font-mono text-sm shadow-glow-down">–</span>
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/20 text-brand font-mono text-sm shadow-glow-brand">★</span>
                  </div>
                </EffectCard>
              </div>
            </Container>
          </div>
        </section>

        {/* SPACING & RADII */}
        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <SectionTitle eyebrow="04 · Geometry" title={locale === 'fr' ? 'Espaces & rayons' : 'Spacing & radii'} />
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <Spec label="Container" value="1280 px" />
              <Spec label="Gutter" value="24 px · 40 px" />
              <Spec label="Section pad" value="py-12 / py-20" />
              <Spec label="Radius" value="rounded-xl (12px) · rounded-2xl (16px)" />
            </div>
          </Container>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}

function SectionTitle({ eyebrow, title, onDark = false }: { eyebrow: string; title: string; onDark?: boolean }) {
  return (
    <div>
      <span className={`font-mono text-[11px] uppercase tracking-[0.22em] ${onDark ? 'text-brand' : 'text-brand'}`}>
        {eyebrow}
      </span>
      <h2 className={`mt-3 font-display text-3xl md:text-4xl font-medium tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        {title}
      </h2>
    </div>
  );
}

function TypeSpec({ label, sample, className }: { label: string; sample: string; className: string }) {
  return (
    <div className="border-b border-line pb-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 ${className}`}>{sample}</div>
    </div>
  );
}

function EffectCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-brand">{title}</div>
      <div className="mt-4 min-h-[88px] flex items-center">{children}</div>
      <p className="mt-4 text-[13px] text-white/55">{desc}</p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-1 text-ink font-medium">{value}</div>
    </div>
  );
}
