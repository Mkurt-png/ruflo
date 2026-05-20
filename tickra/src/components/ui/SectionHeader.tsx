import { Eyebrow } from './Eyebrow';

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  align?: 'left' | 'between';
};

export function SectionHeader({ eyebrow, title, body, align = 'left' }: Props) {
  if (align === 'between') {
    return (
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 lg:col-span-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
            {title}
          </h2>
        </div>
        {body ? (
          <p className="col-span-12 mt-1 max-w-xl text-pretty text-[17px] leading-relaxed text-muted lg:col-span-6 lg:col-start-7 lg:mt-12">
            {body}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
        {title}
      </h2>
      {body ? (
        <p className="mt-6 text-pretty text-[17px] leading-relaxed text-muted">{body}</p>
      ) : null}
    </div>
  );
}
