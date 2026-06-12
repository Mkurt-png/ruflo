import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Prose({ children, className }: Props) {
  return (
    <div
      className={cn(
        'prose-tickra max-w-2xl text-[16px] leading-[1.75] text-ink',
        '[&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-ink',
        '[&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-ink',
        '[&_p]:mt-4 [&_p]:text-muted',
        '[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-muted',
        '[&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-line hover:[&_a]:decoration-ink',
        className,
      )}
    >
      {children}
    </div>
  );
}
