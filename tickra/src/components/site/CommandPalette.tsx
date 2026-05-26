'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Compass, FileText, Hash, Search, Settings } from 'lucide-react';
import { TRACKS } from '@/lib/curriculum/data';
import { GLOSSARY } from '@/lib/curriculum/glossary';
import { searchIndex } from '@/lib/curriculum/search';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Item = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: 'lesson' | 'track' | 'page' | 'term' | 'action';
};

const quickActions = {
  fr: [
    { id: 'lang-en', label: 'Passer en anglais', href: '/en', group: 'action' as const, hint: 'Langue' },
    { id: 'theme-toggle', label: 'Basculer thème clair / sombre', href: '#theme-toggle', group: 'action' as const, hint: 'Apparence' },
    { id: 'signout', label: 'Se déconnecter', href: '/api/auth/signout?locale=fr', group: 'action' as const, hint: 'Session' },
  ],
  en: [
    { id: 'lang-fr', label: 'Switch to French', href: '/fr', group: 'action' as const, hint: 'Language' },
    { id: 'theme-toggle', label: 'Toggle light / dark theme', href: '#theme-toggle', group: 'action' as const, hint: 'Appearance' },
    { id: 'signout', label: 'Sign out', href: '/api/auth/signout?locale=en', group: 'action' as const, hint: 'Session' },
  ],
};

type Props = { locale: 'fr' | 'en' };

const staticPages = {
  fr: [
    { id: 'home', label: 'Accueil', href: '/', group: 'page' as const },
    { id: 'learn', label: 'Apprendre', href: '/learn', group: 'page' as const },
    { id: 'pricing', label: 'Tarifs', href: '/pricing', group: 'page' as const },
    { id: 'editorial', label: 'Éditorial', href: '/editorial', group: 'page' as const },
    { id: 'changelog', label: 'Journal des versions', href: '/changelog', group: 'page' as const },
    { id: 'glossary', label: 'Glossaire', href: '/glossary', group: 'page' as const },
    { id: 'about', label: 'À propos', href: '/about', group: 'page' as const },
    { id: 'contact', label: 'Contact', href: '/contact', group: 'page' as const },
    { id: 'me', label: 'Mon compte', href: '/me', group: 'page' as const },
    { id: 'diploma', label: 'Diplôme', href: '/diploma', group: 'page' as const },
  ],
  en: [
    { id: 'home', label: 'Home', href: '/', group: 'page' as const },
    { id: 'learn', label: 'Learn', href: '/learn', group: 'page' as const },
    { id: 'pricing', label: 'Pricing', href: '/pricing', group: 'page' as const },
    { id: 'editorial', label: 'Editorial', href: '/editorial', group: 'page' as const },
    { id: 'changelog', label: 'Changelog', href: '/changelog', group: 'page' as const },
    { id: 'glossary', label: 'Glossary', href: '/glossary', group: 'page' as const },
    { id: 'about', label: 'About', href: '/about', group: 'page' as const },
    { id: 'contact', label: 'Contact', href: '/contact', group: 'page' as const },
    { id: 'me', label: 'My account', href: '/me', group: 'page' as const },
    { id: 'diploma', label: 'Diploma', href: '/diploma', group: 'page' as const },
  ],
};

const placeholderCopy = { fr: 'Chercher leçons, pages, glossaire…', en: 'Search lessons, pages, glossary…' };
const emptyCopy = { fr: 'Aucun résultat.', en: 'No results.' };
const hintCopy = { fr: 'pour ouvrir', en: 'to open' };

export function CommandPalette({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Build the index once per render — it’s static.
  const items = useMemo<Item[]>(() => {
    const all: Item[] = [];
    for (const a of quickActions[locale]) {
      all.push({ id: `a-${a.id}`, label: a.label, hint: a.hint, href: a.href, group: 'action' });
    }
    for (const p of staticPages[locale]) {
      all.push({ id: `p-${p.id}`, label: p.label, href: `/${locale}${p.href === '/' ? '' : p.href}`, group: 'page' });
    }
    for (const tr of TRACKS) {
      all.push({
        id: `t-${tr.id}`,
        label: tr.title[locale],
        hint: tr.summary[locale],
        href: `/${locale}/learn/${tr.slug}`,
        group: 'track',
      });
      for (const l of tr.lessons) {
        all.push({
          id: `l-${l.id}`,
          label: `${String(l.index).padStart(2, '0')} · ${l.title[locale]}`,
          hint: tr.title[locale],
          href: `/${locale}/learn/${tr.slug}/${l.slug}`,
          group: 'lesson',
        });
      }
    }
    for (const g of GLOSSARY) {
      all.push({
        id: `g-${g.term.en}`,
        label: g.term[locale],
        hint: g.definition[locale].slice(0, 110),
        href: `/${locale}/glossary`,
        group: 'term',
      });
    }
    return all;
  }, [locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    const scored = items
      .map((it) => ({ it, score: score(q, it.label, it.hint) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    const labelScored = scored.map((x) => x.it);

    // Augment with full-text lesson + glossary matches that didn't hit on
    // label/hint alone. De-dup by href.
    if (q.length >= 2) {
      const seen = new Set(labelScored.map((it) => it.href));
      const deep = searchIndex(q, locale, 10);
      for (const d of deep) {
        const href = d.href[locale];
        if (seen.has(href)) continue;
        seen.add(href);
        labelScored.push({
          id: `s-${d.id}`,
          label: d.label[locale],
          hint: d.snippet?.[locale] ?? d.parent?.[locale],
          href,
          group: d.kind === 'lesson' ? 'lesson' : 'term',
        });
      }
    }
    return labelScored;
  }, [items, query, locale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(results.length - 1, a + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === 'Enter') {
        const target = results[active];
        if (target) {
          runItem(target);
          setOpen(false);
        }
      }
    };

    function runItem(item: Item) {
      if (item.href === '#theme-toggle') {
        window.dispatchEvent(new Event('tickra:toggle-theme'));
        return;
      }
      window.location.href = item.href;
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, active, results]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: easeOutExpo }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[12vh] flex max-h-[70vh] w-[min(640px,calc(100%-2rem))] flex-col overflow-hidden rounded-sm border border-line bg-canvas shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search aria-hidden className="h-4 w-4 text-muted" strokeWidth={1.6} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholderCopy[locale]}
                aria-label={placeholderCopy[locale]}
                className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-subtle focus:outline-none"
              />
              <kbd className="hidden rounded-sm border border-line bg-surface px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted sm:inline">
                Esc
              </kbd>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {results.length === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-muted">{emptyCopy[locale]}</div>
              ) : (
                <ul role="listbox">
                  {results.map((r, i) => (
                    <li key={r.id} role="option" aria-selected={i === active}>
                      <Link
                        href={r.href === '#theme-toggle' ? '#' : r.href}
                        onClick={(e) => {
                          if (r.href === '#theme-toggle') {
                            e.preventDefault();
                            window.dispatchEvent(new Event('tickra:toggle-theme'));
                          }
                          setOpen(false);
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          'flex items-center gap-3 px-5 py-3 transition-colors',
                          i === active ? 'bg-elevated' : 'hover:bg-elevated/60',
                        )}
                      >
                        <GroupIcon group={r.group} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] text-ink">{r.label}</span>
                          {r.hint ? (
                            <span className="block truncate font-mono text-[10.5px] uppercase tracking-[0.18em] text-subtle">
                              {r.hint}
                            </span>
                          ) : null}
                        </span>
                        {i === active ? (
                          <span className="flex items-center gap-2 text-muted">
                            <kbd className="rounded-sm border border-line bg-surface px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em]">
                              ↵
                            </kbd>
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em]">
                              {hintCopy[locale]}
                            </span>
                          </span>
                        ) : (
                          <ArrowRight aria-hidden className="h-4 w-4 text-subtle" strokeWidth={1.5} />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-line px-5 py-3">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5">↑↓</kbd>
                  {locale === 'fr' ? 'naviguer' : 'navigate'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5">↵</kbd>
                  {locale === 'fr' ? 'ouvrir' : 'open'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded-sm border border-line bg-surface px-1.5 py-0.5">⌘K</kbd>
                  {locale === 'fr' ? 'fermer' : 'close'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function GroupIcon({ group }: { group: Item['group'] }) {
  if (group === 'lesson') {
    return <BookOpen aria-hidden className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.6} />;
  }
  if (group === 'track') {
    return <Compass aria-hidden className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.6} />;
  }
  if (group === 'page') {
    return <FileText aria-hidden className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.6} />;
  }
  if (group === 'term') {
    return <Hash aria-hidden className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.6} />;
  }
  return <Settings aria-hidden className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.6} />;
}

function score(query: string, label: string, hint?: string): number {
  const haystack = (label + ' ' + (hint ?? '')).toLowerCase();
  if (haystack.includes(query)) {
    // Exact prefix match on label gets the highest weight.
    if (label.toLowerCase().startsWith(query)) return 100;
    // Token start match
    if (haystack.split(/\s+/).some((tok) => tok.startsWith(query))) return 80;
    return 60;
  }
  // Loose fuzzy: every char of query appears in order somewhere.
  let i = 0;
  for (const ch of haystack) {
    if (ch === query[i]) i += 1;
    if (i === query.length) return 30;
  }
  return 0;
}
