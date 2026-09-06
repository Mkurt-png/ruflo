// The publishing entity, in one place.
//
// The site previously declared a French SAS (RCS Paris, SIREN, CNIL, AMF
// France) while the business actually operates from Canada and settles into a
// Canadian bank account. Every one of those French facts was wrong, and wrong
// in the way that matters: the entity that collects the money determines which
// sales taxes apply, which regulator's language belongs on the risk warning,
// which privacy law governs the data, and which courts hear a dispute.
//
// The values below are the ones only the operator can supply. They are
// deliberately left as visible placeholders rather than plausible-looking
// invented ones: a legal page that reads "[À COMPLÉTER]" is obviously
// unfinished, whereas a fabricated registration number looks finished and is a
// false statement to every visitor.
//
// ⚠️  These pages are a starting point drafted from public sources, not legal
//     advice. Have them reviewed by a Québec lawyer before taking payments.

/** Marks a fact the operator still has to supply. */
const TODO = (what: string) => `[À COMPLÉTER : ${what}]`;

export const ENTITY = {
  /** Registered legal name — e.g. "9999-9999 Québec inc." or a sole proprietorship. */
  legalName: TODO('dénomination légale de l’entreprise'),
  /** Québec enterprise number from the Registraire des entreprises. */
  neq: TODO('NEQ'),
  /** Canada Revenue Agency business number, if registered for GST/QST. */
  businessNumber: TODO('numéro d’entreprise (ARC)'),
  /** Head office address. */
  address: TODO('adresse du siège'),
  province: 'Québec',
  country: 'Canada',
  countryCode: 'CA',
} as const;

/** True while any entity fact is still a placeholder. */
export function hasUnfilledEntityFacts(): boolean {
  return Object.values(ENTITY).some((v) => v.startsWith('[À COMPLÉTER'));
}

/** Regulators and statutes referenced by the legal pages. */
export const REGULATORS = {
  securities: {
    fr: 'Autorité des marchés financiers (AMF) du Québec',
    en: 'Autorité des marchés financiers (AMF) of Québec',
    url: 'https://lautorite.qc.ca',
  },
  /** National self-regulatory body for investment dealers. */
  dealers: {
    fr: 'Organisme canadien de réglementation des investissements (OCRI)',
    en: 'Canadian Investment Regulatory Organization (CIRO)',
    url: 'https://www.ciro.ca',
  },
  privacyQuebec: {
    fr: 'Commission d’accès à l’information du Québec (CAI)',
    en: 'Commission d’accès à l’information du Québec (CAI)',
    url: 'https://www.cai.gouv.qc.ca',
  },
  privacyCanada: {
    fr: 'Commissariat à la protection de la vie privée du Canada',
    en: 'Office of the Privacy Commissioner of Canada',
    url: 'https://www.priv.gc.ca',
  },
  /** Québec problem-gambling helpline, replacing the French service. */
  gamblingHelp: {
    fr: 'Jeu : aide et référence — 1 866 767-5389 (24 h/24, gratuit)',
    en: 'Gambling: Help and Referral — 1-866-767-5389 (24/7, free)',
  },
} as const;
