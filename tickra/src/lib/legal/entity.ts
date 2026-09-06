// The operator of the site, in one place.
//
// The site previously declared a French SAS (RCS Paris, SIREN, CNIL, AMF
// France) while the business operates from Québec and settles into a Québec
// credit union. None of those French facts were true, and it is not cosmetic:
// the party that collects the money decides which sales taxes apply, whose
// regulator's language belongs on the risk warning, which privacy law governs
// the data, and which courts hear a dispute.
//
// There is no incorporated company. The operator is a natural person, so the
// model here is a sole operator: no share capital, and no registration numbers
// unless and until they exist. Fields that do not apply are `null`, and every
// surface omits them rather than printing an empty label — a legal page must
// never imply a registration that was never made.
//
// ⚠️  Drafted from public sources. Not legal advice. Have it reviewed by a
//     Québec lawyer or notary before taking payments.

export type Operator = {
  /** How the operator is legally identified. */
  kind: 'individual' | 'company';
  /** Full legal name of the person, or the registered company name. */
  legalName: string;
  /** Street line, e.g. "475, rue Notre-Dame". */
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  countryCode: string;
  /**
   * Québec enterprise number. Null while unregistered.
   *
   * Note: in Québec a natural person who carries on an activity under a name
   * that is not their own surname and given name must register with the
   * Registraire des entreprises. Trading under "kNOWTrade" rather than the
   * operator's own name therefore appears to require registration — worth
   * confirming before launch.
   */
  neq: string | null;
  /** CRA business number. Null until registered for GST/QST. */
  businessNumber: string | null;
};

export const ENTITY: Operator = {
  kind: 'individual',
  legalName: 'Hamza Kurt',
  street: '475, rue Notre-Dame',
  city: 'Victoriaville',
  postalCode: 'G6B 4B3',
  province: 'Québec',
  country: 'Canada',
  countryCode: 'CA',
  // Not registered. Leave null rather than inventing a number — the pages
  // simply omit the line.
  neq: null,
  businessNumber: null,
};

/**
 * The postal address on one line, written the Québec way:
 * street, city (Province) POSTAL CODE.
 */
export function entityPostalAddress(): string {
  return `${ENTITY.street}, ${ENTITY.city} (${ENTITY.province}) ${ENTITY.postalCode}`;
}

/**
 * Identity line for footers and credits: the name, plus any registration
 * numbers that actually exist, plus the place.
 */
export function entityIdentityLine(): string {
  const parts = [ENTITY.legalName];
  if (ENTITY.neq) parts.push(`NEQ ${ENTITY.neq}`);
  parts.push(`${ENTITY.province}, ${ENTITY.country}`);
  return parts.join(' · ');
}

/** Address block lines, with absent registrations dropped. */
export function entityAddressLines(): string[] {
  // `address` already carries the city and province, so only the country is
  // added — repeating "Québec" on its own line reads as a formatting bug.
  const lines = [ENTITY.legalName, entityPostalAddress(), ENTITY.country];
  if (ENTITY.neq) lines.push(`NEQ ${ENTITY.neq}`);
  return lines;
}

/** How to describe the operator in a sentence, e.g. in the terms. */
export function entityDescription(locale: 'fr' | 'en'): string {
  const where = `${entityPostalAddress()}, ${ENTITY.country}`;
  const registration = ENTITY.neq ? (locale === 'fr' ? ` (NEQ ${ENTITY.neq})` : ` (NEQ ${ENTITY.neq})`) : '';
  if (locale === 'fr') {
    return ENTITY.kind === 'individual'
      ? `${ENTITY.legalName}, travailleur autonome établi au ${ENTITY.province}, ${ENTITY.country}, joignable à l’adresse ${where}${registration}`
      : `${ENTITY.legalName}, dont le siège est situé ${where}${registration}`;
  }
  return ENTITY.kind === 'individual'
    ? `${ENTITY.legalName}, a self-employed operator based in ${ENTITY.province}, ${ENTITY.country}, contactable at ${where}${registration}`
    : `${ENTITY.legalName}, head office at ${where}${registration}`;
}

/** Regulators and statutes referenced by the legal pages. */
export const REGULATORS = {
  securities: {
    fr: 'Autorité des marchés financiers (AMF) du Québec',
    en: 'Autorité des marchés financiers (AMF) of Québec',
    url: 'https://lautorite.qc.ca',
  },
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
  gamblingHelp: {
    fr: 'Jeu : aide et référence — 1 866 767-5389 (24 h/24, gratuit)',
    en: 'Gambling: Help and Referral — 1-866-767-5389 (24/7, free)',
  },
} as const;
