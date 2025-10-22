import { useSite } from '@rspress/runtime';
import type { SocialLink } from '@rspress/shared';
import ArrowDown from '@theme-assets/arrow-down';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';
import { useHoverGroup } from '../HoverGroup/useHoverGroup';
import { SocialLink as SocialLinkComp } from './SocialLink';

const MORE_LENGTH = 5;

export const SocialLinks = ({
  socialLinks: socialLinksFromProps,
}: {
  socialLinks?: SocialLink[];
}) => {
  const { site } = useSite();

  const socialLinks =
    site.themeConfig.socialLinks || socialLinksFromProps || [];
  const isMore = socialLinks.length > MORE_LENGTH;

  const shownLinks: SocialLink[] = socialLinks.slice(0, MORE_LENGTH);
  const hiddenLinks: SocialLink[] = socialLinks.slice(MORE_LENGTH);

  const { hoverGroup, handleMouseEnter, handleMouseLeave } = useHoverGroup({
    position: 'right',
    customChildren: isMore ? (
      <div className="rp-social-links__hidden">
        {hiddenLinks.map((item, index) => (
          <SocialLinkComp
            key={item.content}
            link={item}
            hoverGroupPosition={
              index === hiddenLinks.length - 1 ? 'right' : 'center'
            }
          />
        ))}
      </div>
    ) : null,
  });

  if (socialLinks.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-social-links" onMouseLeave={handleMouseLeave}>
      {shownLinks.map((item, index) => (
        <SocialLinkComp
          key={item.content}
          link={item}
          hoverGroupPosition={
            index === shownLinks.length - 1 ? 'right' : 'center'
          }
        />
      ))}
      {isMore ? (
        <SvgWrapper
          icon={ArrowDown}
          onMouseEnter={handleMouseEnter}
          fontSize={20}
        />
      ) : null}
      {hoverGroup}
    </div>
  );
};
