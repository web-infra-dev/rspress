import type { SocialLink } from '@rspress/shared';
import { LinkContent } from './LinkContent';

interface IHiddenLinksProps {
  links: SocialLink[];
}

export const HiddenLinks = (props: IHiddenLinksProps) => {
  const { links } = props;

  return (
    <div
      style={{
        boxShadow: 'var(--rp-shadow-3)',
        marginRight: '-2px',
        border: '1px solid var(--rp-c-divider-light)',
        background: 'var(--rp-c-bg)',
      }}
      className="absolute top-8 right-0 z-1 p-3 w-32 rounded-2xl flex flex-wrap gap-4"
    >
      {links.map(item => (
        <LinkContent
          key={item.content}
          link={item}
          popperStyle={{ top: '1.25rem' }}
        />
      ))}
    </div>
  );
};
