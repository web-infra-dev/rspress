import type { SocialLink as ISocialLink } from '@rspress/core';
import iconMap from 'virtual-social-links';
import './index.scss';
import { useHoverGroup } from '../HoverGroup/useHoverGroup';

interface SocialLinkProps {
  link: ISocialLink;
  /**
   * @default 'center'
   */
  hoverGroupPosition?: 'center' | 'left' | 'right';
}

const getIconLabel = (icon: ISocialLink['icon']): string => {
  if (typeof icon === 'string') {
    return icon;
  }
  return icon?.svg ? 'social link' : '';
};

export const SocialLink = (props: SocialLinkProps) => {
  const { link, hoverGroupPosition = 'center' } = props;
  const { icon, mode = 'link', content } = link;
  const iconLabel = getIconLabel(icon);

  let IconComp: React.ReactElement = <></>;
  if (icon) {
    const html = typeof icon === 'string' ? iconMap[icon] : icon.svg;
    IconComp = (
      <div
        className="rp-social-links__icon"
        dangerouslySetInnerHTML={{ __html: html }}
        aria-hidden="true"
      ></div>
    );
  }

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    position: hoverGroupPosition,
    customChildren: (
      <div className="rp-social-links__item__hover-group">
        {mode === 'text' ? (
          <div className="rp-social-links__item__text">{content}</div>
        ) : mode === 'dom' ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : mode === 'img' ? (
          <img src={content} alt="img" />
        ) : null}
      </div>
    ),
  });

  if (mode === 'link') {
    return (
      <a
        key={content}
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="rp-social-links__item"
        aria-label={iconLabel}
      >
        <div className="rp-social-links__icon">{IconComp}</div>
      </a>
    );
  }

  if (mode === 'text') {
    return (
      <div
        className="rp-social-links__item"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {IconComp}
        {hoverGroup}
      </div>
    );
  }
  if (mode === 'img') {
    return (
      <div
        className="rp-social-links__item"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {IconComp}
        {hoverGroup}
      </div>
    );
  }
  if (mode === 'dom') {
    return (
      <div
        className="rp-social-links__item"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {IconComp}
        {hoverGroup}
      </div>
    );
  }

  return <div className="rp-social-links__item"></div>;
};
