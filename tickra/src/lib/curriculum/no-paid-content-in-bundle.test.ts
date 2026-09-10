import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// The paid curriculum — 222 lesson bodies, every drill answer, every quiz
// rationale — lives in `lib/curriculum/lesson-content.ts`. It is gated by the
// server-side entitlement check in learn/[track]/[lesson]/page.tsx.
//
// That gate is worth nothing if a `'use client'` component imports the module,
// because Next then bundles it into a public JS chunk served to every visitor
// on every page. That is exactly what happened: CommandPalette (mounted in the
// root layout) imported it transitively through `curriculum/search`, and the
// whole answer key shipped to anonymous users.
//
// This test is the guard. It is intentionally a source-level check rather than
// a build-output check so it runs in CI without a build, and it is paired with
// the stronger post-build grep documented in the repo README.

const SRC = resolve(__dirname, '../..');

/**
 * A value import of the paid-content module, or of a module that has one.
 *
 * `import type { LessonContent } from '…/lesson-content'` is erased by the
 * compiler and ships nothing, so it is allowed and skipped here — that is the
 * correct way for a client component to be typed against lesson data it
 * receives as a prop from the server. Only value imports pull the 4,900-line
 * module into the bundle.
 */
const VALUE_IMPORT = /(?<!\btype\s)\bfrom\s+['"]([^'"]+)['"]/g;

function valueImportSpecifiers(source: string): string[] {
  // Drop `import type { … } from '…'` and `export type … from '…'` lines
  // wholesale before scanning, so their specifiers are never considered.
  const withoutTypeImports = source.replace(
    /^\s*(?:import|export)\s+type\s[^;]*?;/gm,
    '',
  );
  return [...withoutTypeImports.matchAll(VALUE_IMPORT)].map((m) => m[1]);
}

function mentionsPaidContent(specifier: string): boolean {
  return (
    specifier === '@/lib/curriculum/lesson-content' ||
    /(^|\/)lesson-content$/.test(specifier)
  );
}

/** Every .ts/.tsx file under src/, excluding tests. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      sourceFiles(full, out);
      continue;
    }
    if (!/\.tsx?$/.test(name)) continue;
    if (/\.test\.tsx?$/.test(name)) continue;
    out.push(full);
  }
  return out;
}

const files = sourceFiles(SRC);

/**
 * A module is client-side if it is marked `'use client'`. Anything it imports
 * is pulled into the browser bundle, so the check has to follow imports one
 * level deep at minimum — the original leak was exactly one level deep
 * (CommandPalette → curriculum/search → lesson-content).
 */
function isClientModule(source: string): boolean {
  return /^\s*['"]use client['"]/.test(source);
}

function importsPaidContent(source: string): boolean {
  return valueImportSpecifiers(source).some(mentionsPaidContent);
}

/** Local `@/`-style VALUE imports declared by a file, as absolute paths. */
function localImports(file: string, source: string): string[] {
  const out: string[] = [];
  for (const spec of valueImportSpecifiers(source)) {
    if (!spec.startsWith('@/')) continue;
    const rel = spec.slice('@/'.length);
    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const candidate = join(SRC, rel + ext);
      try {
        if (statSync(candidate).isFile()) {
          out.push(candidate);
          break;
        }
      } catch {
        /* not this extension */
      }
    }
  }
  return out;
}

describe('paid curriculum never reaches the browser bundle', () => {
  it('no client component imports lesson-content', () => {
    const offenders = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      return isClientModule(src) && importsPaidContent(src);
    });
    expect(offenders.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });

  it('no client component reaches lesson-content through one of its imports', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      if (!isClientModule(src)) continue;
      for (const dep of localImports(f, src)) {
        const depSrc = readFileSync(dep, 'utf8');
        if (importsPaidContent(depSrc)) {
          offenders.push(`${f.slice(SRC.length + 1)} → ${dep.slice(SRC.length + 1)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the search index itself stays free of paid content', () => {
    const src = readFileSync(join(SRC, 'lib/curriculum/search.ts'), 'utf8');
    expect(importsPaidContent(src)).toBe(false);
  });
});
