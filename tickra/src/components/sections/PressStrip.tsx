import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/lib/i18n/dictionaries';

const outlets = ['Les Échos', 'Sifted', 'Maddyness', 'Frenchweb', 'Capital', 'Forbes FR'];

export function PressStrip({ dict }: { dict: Dictionary }) {
  return (
    <section
      aria-labelledby="press-title"
      className="border-b border-line bg-canvas"
    >
      <Container as="div" className="py-14 md:py-16">
        <h2
          id="press-title"
          className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-muted"
        >
          {dict.press.title}
        </h2>

        <ul className="mt-10 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
          {outlets.map((name) => (
            <li
              key={name}
              className="font-display text-[18px] font-medium tracking-tight text-subtle transition-colors hover:text-ink md:text-[20px]"
              title={name}
            >
              {name}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
