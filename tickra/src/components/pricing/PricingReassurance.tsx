import { CheckCircle2, CreditCard, Lock, ShieldCheck, X } from 'lucide-react';

type Locale = 'fr' | 'en';

const copy = {
  fr: {
    eyebrow: 'Vos garanties',
    bullets: [
      {
        icon: 'shield',
        title: 'Garantie 14 jours',
        body: 'Pas convaincu·e ? Remboursement intégral en un clic, sans question, dans les 14 jours.',
      },
      {
        icon: 'cancel',
        title: 'Annulable à tout moment',
        body: 'Aucun engagement. Vous gardez l’accès jusqu’à la fin de la période payée.',
      },
      {
        icon: 'stripe',
        title: 'Paiement sécurisé Stripe',
        body: 'Vos données bancaires ne transitent jamais par Tickra. Stripe est certifié PCI-DSS niveau 1.',
      },
      {
        icon: 'lock',
        title: 'Vos données vous appartiennent',
        body: 'Export RGPD intégral en un clic depuis votre compte. Aucune revente de données.',
      },
    ],
    faqTitle: 'Questions tarifs',
    faq: [
      {
        q: 'TVA incluse ?',
        a: 'Oui. Le prix affiché est TTC pour les particuliers européens. Une facture est envoyée automatiquement après chaque paiement.',
      },
      {
        q: 'Quels modes de paiement ?',
        a: 'Cartes bancaires (Visa, Mastercard, Amex), Apple Pay, Google Pay, et SEPA. Tous via Stripe.',
      },
      {
        q: 'Différence Pro vs À vie ?',
        a: 'Pro = abonnement mensuel ou annuel, accès à tout le contenu actuel. À vie = paiement unique, accès permanent + tous les futurs modules inclus + cohorte privée.',
      },
      {
        q: 'Puis-je passer de Pro à À vie ?',
        a: 'Oui, à tout moment. Le prorata des mois Pro restants est déduit du prix À vie. Contactez-nous depuis votre espace.',
      },
      {
        q: 'Et si je quitte avant la fin de l’abonnement ?',
        a: 'Vous gardez l’accès Pro jusqu’à la fin de la période déjà payée. Aucune facturation ne se déclenche après.',
      },
    ],
  },
  en: {
    eyebrow: 'Your safeguards',
    bullets: [
      {
        icon: 'shield',
        title: '14-day guarantee',
        body: 'Not convinced? One-click full refund, no questions asked, within 14 days.',
      },
      {
        icon: 'cancel',
        title: 'Cancel any time',
        body: 'No commitment. You keep access until the end of the paid period.',
      },
      {
        icon: 'stripe',
        title: 'Secure Stripe payment',
        body: 'Your card details never touch Tickra. Stripe is PCI-DSS Level 1 certified.',
      },
      {
        icon: 'lock',
        title: 'Your data is yours',
        body: 'Full GDPR export in one click from your account. Zero data resale.',
      },
    ],
    faqTitle: 'Pricing FAQ',
    faq: [
      {
        q: 'VAT included?',
        a: 'Yes. Prices shown include VAT for European individuals. An invoice is sent automatically after each payment.',
      },
      {
        q: 'Payment methods?',
        a: 'Cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and SEPA. All via Stripe.',
      },
      {
        q: 'Pro vs Lifetime?',
        a: 'Pro = monthly or annual subscription, access to all current content. Lifetime = one-off payment, permanent access + all future modules + private cohort.',
      },
      {
        q: 'Can I switch from Pro to Lifetime?',
        a: 'Yes, any time. The remaining Pro months are deducted prorata from the Lifetime price. Contact us from your account.',
      },
      {
        q: 'What if I cancel before the end of the subscription?',
        a: 'You keep Pro access until the end of the already-paid period. No billing fires afterwards.',
      },
    ],
  },
};

const IconMap = {
  shield: ShieldCheck,
  cancel: X,
  stripe: CreditCard,
  lock: Lock,
} as const;

// financial reassurance band — 14-day guarantee, Stripe
// security, GDPR, cancel anytime — plus a short pricing FAQ. Lifted directly
// above the comparison table to defuse hesitation before the user scrolls.
export function PricingReassurance({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.eyebrow}</h2>
      <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {t.bullets.map((b) => {
          const Icon = IconMap[b.icon as keyof typeof IconMap];
          return (
            <li key={b.title} className="flex flex-col gap-3 rounded-sm border border-line bg-surface p-6">
              <Icon aria-hidden className="h-5 w-5 text-brand" strokeWidth={1.5} />
              <div className="font-display text-base font-medium tracking-tight text-ink">{b.title}</div>
              <p className="text-[13.5px] leading-relaxed text-muted">{b.body}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-16">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{t.faqTitle}</h3>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {t.faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-[15.5px] font-medium tracking-tight text-ink md:text-base">
                {f.q}
                <span
                  aria-hidden
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45"
                >
                  <svg aria-hidden viewBox="0 0 16 16" className="h-2.5 w-2.5">
                    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </summary>
              <dd className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-muted">{f.a}</dd>
            </details>
          ))}
        </dl>
      </div>

      <p className="mt-10 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-subtle">
        <CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-up" strokeWidth={1.75} />
        {locale === 'fr'
          ? 'Pas de carte requise pour démarrer en gratuit.'
          : 'No card required to start free.'}
      </p>
    </div>
  );
}
