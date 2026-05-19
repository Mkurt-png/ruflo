import { type HTMLAttributes, type ElementType, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Props = HTMLAttributes<HTMLElement> & { as?: ElementType };

export const Container = forwardRef<HTMLElement, Props>(function Container(
  { as: Tag = 'div', className, children, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={cn('mx-auto w-full max-w-container px-6 md:px-10', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
});
