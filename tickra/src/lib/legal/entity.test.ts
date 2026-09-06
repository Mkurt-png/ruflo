import { describe, it, expect } from 'vitest';
import { ENTITY, entityAddressLines, entityIdentityLine, entityDescription } from './entity';

// The whole point of these helpers is that an unregistered sole operator must
// never appear to hold a registration. "NEQ null" or a bare "NEQ" label on a
// legal page is a false claim, so it is worth a test rather than a comment.

describe('entity surfaces never imply a registration that does not exist', () => {
  const rendered = [
    entityIdentityLine(),
    entityDescription('fr'),
    entityDescription('en'),
    ...entityAddressLines(),
  ].join('\n');

  it('never prints a null or undefined value', () => {
    expect(rendered).not.toMatch(/null|undefined/);
  });

  it('mentions NEQ only when one is actually set', () => {
    if (ENTITY.neq) expect(rendered).toContain(ENTITY.neq);
    else expect(rendered).not.toMatch(/NEQ/);
  });

  it('mentions a CRA business number only when one is actually set', () => {
    if (!ENTITY.businessNumber) expect(rendered).not.toMatch(/ARC|CRA/);
  });

  it('always states the name and the place', () => {
    expect(entityIdentityLine()).toContain(ENTITY.legalName);
    expect(entityIdentityLine()).toContain(ENTITY.province);
    expect(entityAddressLines()[0]).toBe(ENTITY.legalName);
  });

  it('describes a sole operator as self-employed, not as a company with a head office', () => {
    if (ENTITY.kind === 'individual') {
      expect(entityDescription('fr')).toContain('travailleur autonome');
      expect(entityDescription('en')).toContain('self-employed');
      expect(entityDescription('fr')).not.toContain('siège');
    }
  });
});
