// RiskDisclosure — regulator-aware risk warning to display anywhere we discuss
// trading, leverage, or paid market education. Visible by default;
// collapsible variant available for tight surfaces like pricing cards.

import type { Locale } from '@/lib/i18n/config';
import { AlertTriangle } from 'lucide-react';

type Props = {
  locale: Locale;
  /** Compact one-line variant. */
  variant?: 'block' | 'inline';
  className?: string;
};

const COPY = {
  fr: {
    label: 'Avertissement risques',
    short:
      'Le trading comporte un risque élevé de perte rapide en capital. Les performances passées ne préjugent pas des performances futures. kNOWTrade ne fournit ni signaux, ni conseil personnalisé en investissement.',
    long: [
      'Le trading et l’investissement sur les marchés financiers, et notamment l’utilisation d’instruments avec effet de levier (CFD, futures, forex, crypto), comportent un risque élevé de perte rapide et totale du capital. Une majorité d’investisseurs particuliers perdent de l’argent.',
      'kNOWTrade est une plateforme d’éducation. Nous ne fournissons aucun signal d’achat ou de vente, aucun conseil personnalisé en investissement, ni aucune gestion de portefeuille. Nous ne sommes inscrits ni comme courtier ni comme conseiller auprès de l’Autorité des marchés financiers du Québec.',
      'Toute décision d’investissement reste sous votre seule responsabilité. Avant d’engager des fonds réels, assurez-vous de comprendre les instruments concernés, votre tolérance au risque, et le cas échéant consultez un conseiller inscrit auprès de l’Autorité des marchés financiers du Québec.',
    ],
  },
  en: {
    label: 'Risk warning',
    short:
      'Trading carries a high risk of rapid capital loss. Past performance is not indicative of future results. kNOWTrade provides no signals and no personalised investment advice.',
    long: [
      'Trading and investing on financial markets — particularly leveraged instruments (CFDs, futures, FX, crypto) — carry a high risk of rapid and total capital loss. The majority of retail investors lose money.',
      'kNOWTrade is an education platform. We do not provide buy or sell signals, personalised investment advice, or portfolio management. We are registered neither as a dealer nor as an adviser with the Autorité des marchés financiers of Québec.',
      'Every investment decision is yours alone. Before committing real funds, make sure you understand the instruments involved, your risk tolerance, and where appropriate consult an authorised financial advisor.',
    ],
  },
} as const;

export function RiskDisclosure({ locale, variant = 'block', className = '' }: Props) {
  const t = COPY[locale];

  if (variant === 'inline') {
    return (
      <div
        role="note"
        className={`flex items-start gap-2 rounded-md border border-line bg-elevated/60 px-3 py-2 text-[12px] leading-snug text-muted ${className}`}
      >
        <AlertTriangle aria-hidden className="mt-[1px] h-3.5 w-3.5 text-down" strokeWidth={1.75} />
        <span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-down/90">{t.label}</span>{' '}
          {t.short}
        </span>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label={t.label}
      className={`rounded-md border border-line bg-elevated/60 p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle aria-hidden className="h-4 w-4 text-down" strokeWidth={1.75} />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-down">{t.label}</span>
      </div>
      <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-muted">
        {t.long.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </aside>
  );
}

export default RiskDisclosure;
