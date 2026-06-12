'use client';

import { Star } from 'lucide-react';
import { useBookmarks } from '@/lib/progress/bookmarks';
import { cn } from '@/lib/cn';

type Props = {
  lessonId: string;
  label?: { fr: string; en: string };
  locale?: 'fr' | 'en';
  size?: 'sm' | 'md';
};

export function BookmarkButton({ lessonId, locale = 'en', size = 'md' }: Props) {
  const { toggle, isBookmarked, ready } = useBookmarks();
  const active = ready && isBookmarked(lessonId);
  const labelText = active
    ? locale === 'fr' ? 'Retirer le favori' : 'Remove bookmark'
    : locale === 'fr' ? 'Ajouter aux favoris' : 'Bookmark';
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconDim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={labelText}
      title={labelText}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(lessonId);
      }}
      className={cn(
        dim,
        'inline-flex flex-shrink-0 items-center justify-center rounded-full border transition-colors',
        active
          ? 'border-ink bg-ink text-canvas'
          : 'border-line bg-surface text-muted hover:border-ink hover:text-ink',
      )}
    >
      <Star
        aria-hidden
        className={cn(iconDim, active && 'fill-current')}
        strokeWidth={1.6}
      />
    </button>
  );
}
