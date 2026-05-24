// Plausible analytics — privacy-first, cookieless, no banner required (CNIL-friendly).
// Activates only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
// Optional: NEXT_PUBLIC_PLAUSIBLE_SRC to point at a self-hosted instance.

import Script from 'next/script';

export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.outbound-links.js';
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
