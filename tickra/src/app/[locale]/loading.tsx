import { Container } from '@/components/ui/Container';

export default function Loading() {
  return (
    <main className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div className="h-3 w-16 animate-pulse rounded-full bg-line" />
        <div className="mt-8 h-12 w-3/4 max-w-2xl animate-pulse rounded-sm bg-line md:h-16" />
        <div className="mt-6 h-4 w-2/3 max-w-xl animate-pulse rounded-sm bg-line" />
        <div className="mt-3 h-4 w-1/2 max-w-md animate-pulse rounded-sm bg-line" />
        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-sm border border-line bg-surface" />
          ))}
        </div>
      </Container>
    </main>
  );
}
