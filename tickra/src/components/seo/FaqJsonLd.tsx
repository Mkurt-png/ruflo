// FAQPage schema — wraps any list of {q, a} entries so the page gets
// FAQ-snippet eligibility in Google. Safe to mount on any page that
// already shows the same Q&A in plain HTML (Google requires both).

export type FaqEntry = { q: string; a: string };

export function FaqJsonLd({ entries }: { entries: ReadonlyArray<FaqEntry> }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.q,
      acceptedAnswer: { '@type': 'Answer', text: e.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default FaqJsonLd;
