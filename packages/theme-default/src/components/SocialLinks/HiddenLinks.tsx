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
      className="rp-absolute rp-top-8 rp-right-0 rp-z-1 rp-p-3 rp-w-32 rp-rounded-2xl rp-flex rp-flex-wrap rp-gap-4"
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
