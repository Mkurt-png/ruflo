import { describe, it, expect } from 'vitest';
import { renderEmail } from './layout';

// The properties here are the ones that moved the sign-in mail out of Gmail's
// spam folder. They are cheap to keep and expensive to lose again.

const sample = {
  heading: 'Bienvenue',
  intro: 'Votre accès est actif.',
  cta: { label: 'Ouvrir le cursus', url: 'https://example.com/fr/curriculum' },
  footer: ['Vous recevez ce message parce que…', 'Se désinscrire : https://example.com/u'],
};

describe('renderEmail', () => {
  it('always names the sender', () => {
    const { html, text } = renderEmail(sample);
    expect(html).toContain('nkNOWTrade');
    expect(text).toContain('nkNOWTrade');
  });

  it('gives the action a label, and still spells the URL out', () => {
    const { html, text } = renderEmail(sample);
    // A long URL used as its own anchor text is the phishing shape filters
    // score against; the label is what the reader clicks.
    expect(html).toContain('>Ouvrir le cursus<');
    expect(html).toContain('href="https://example.com/fr/curriculum"');
    // Still present as text, for clients that strip the button and for the
    // plain-text part, which has no button to press.
    expect(text).toContain('https://example.com/fr/curriculum');
  });

  it('carries the same words in both parts', () => {
    const { html, text } = renderEmail(sample);
    for (const line of [sample.heading, sample.intro, ...sample.footer]) {
      expect(text).toContain(line);
      // The HTML escapes, so compare on a distinctive fragment.
      expect(html).toContain(line.split(' ')[0]);
    }
  });

  it('always explains why the message arrived', () => {
    const { html } = renderEmail(sample);
    expect(html).toContain('Vous recevez ce message parce que');
  });

  it('works without a call to action', () => {
    const { html, text } = renderEmail({ ...sample, cta: undefined });
    expect(html).not.toContain('<a href');
    expect(text).toContain(sample.intro);
  });

  it('escapes content rather than injecting it', () => {
    const { html } = renderEmail({
      heading: '<script>alert(1)</script>',
      intro: 'x & y',
      footer: ['"quoted"'],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('x &amp; y');
  });

  it('never leaves a run of blank lines in the text part', () => {
    const { text } = renderEmail(sample);
    expect(text).not.toMatch(/\n{3,}/);
  });
});
