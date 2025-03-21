import type { SocialLink } from '@rspress/shared';
import ArrowDown from '@theme-assets/arrow-down';
import { SvgWrapper } from '../SvgWrapper';
import { LinkContent } from './LinkContent';

interface IShownLinksProps {
  links: SocialLink[];
  moreIconVisible?: boolean;
  mouseEnter: () => void;
}

export const ShownLinks = (props: IShownLinksProps) => {
  const { links, moreIconVisible = false, mouseEnter } = props;

  return (
    <>
      <div className="rp-flex-center rp-h-full rp-gap-x-4 rp-transition-colors rp-duration-300 md:rp-mr-2">
        {links.map((item, index) => (
          <LinkContent
            key={index}
            link={item}
            popperStyle={{ top: '2.5rem' }}
          />
        ))}
      </div>
      {moreIconVisible ? (
        <div className="md:rp-ml-1 rp-p-2" onMouseEnter={mouseEnter}>
          <SvgWrapper icon={ArrowDown} />
        </div>
      ) : null}
    </>
  );
};
