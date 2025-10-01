import type { SocialLink as ISocialLink } from '@rspress/shared';
import { useState } from 'react';
import iconMap from 'virtual-social-links';
import './index.scss';

interface SocialLinkProps {
  link: ISocialLink;
}

export const SocialLink = (props: SocialLinkProps) => {
  const { link } = props;
  const { icon, mode = 'link', content } = link;

  let IconComp: React.ReactElement = <></>;
  if (icon) {
    const html = typeof icon === 'string' ? iconMap[icon] : icon.svg;
    IconComp = (
      <div
        className="rp-social-links__icon"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    );
  }

  const [contentVisible, setContentVisible] = useState(false);
  const mouseEnterIcon = () => {
    setContentVisible(true);
  };
  const mouseLeavePopper = () => {
    setContentVisible(false);
  };

  if (mode === 'link') {
    return (
      <a
        key={content}
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        className="rp-social-links__item"
      >
        <div className="rp-social-links__icon">{IconComp}</div>
      </a>
    );
  }

  if (mode === 'text') {
    return (
      <div
        className="rp-social-links__item"
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div>
            <div>{content}</div>
          </div>
        ) : null}
      </div>
    );
  }
  if (mode === 'img') {
    return (
      <div
        className="rp-social-links__icon"
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div>
            <img src={content} alt="img" />
          </div>
        ) : null}
      </div>
    );
  }
  if (mode === 'dom') {
    return (
      <div
        className="rp-social-links__item"
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : null}
      </div>
    );
  }

  return <div></div>;
};
