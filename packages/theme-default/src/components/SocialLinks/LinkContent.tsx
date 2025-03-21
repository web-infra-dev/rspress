import type { SocialLink } from '@rspress/shared';
import { useState } from 'react';
import * as styles from './index.module.scss';

declare const process: {
  env: {
    RSPRESS_SOCIAL_ICONS: Record<string, string>;
  };
};

interface ILinkContentComp {
  link: SocialLink;
  popperStyle?: Record<string, unknown>;
}

export const LinkContent = (props: ILinkContentComp) => {
  const { link, popperStyle = {} } = props;
  const { icon, mode = 'link', content } = link;

  let IconComp: React.ReactElement = <></>;
  if (icon) {
    const iconMap = process.env.RSPRESS_SOCIAL_ICONS;
    const html = typeof icon === 'string' ? iconMap[icon] : icon.svg;
    IconComp = <div dangerouslySetInnerHTML={{ __html: html }}></div>;
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
        className="social-links"
      >
        <div className={`${styles.socialLinksIcon}`}>{IconComp}</div>
      </a>
    );
  }
  if (mode === 'text') {
    return (
      <div
        className={`${styles.socialLinksIcon} rp-cursor-pointer rp-relative rp-mx-3`}
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div
            style={{
              boxShadow: 'var(--rp-shadow-3)',
              border: '1px solid var(--rp-c-divider-light)',
              ...popperStyle,
            }}
            className="rp-z-[1] rp-p-3 rp-w-50 rp-absolute rp-right-0 rp-bg-white dark:rp-bg-dark"
          >
            <div className="rp-text-md">{content}</div>
          </div>
        ) : null}
      </div>
    );
  }
  if (mode === 'img') {
    return (
      <div
        className={`${styles.socialLinksIcon} rp-cursor-pointer rp-relative`}
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div
            className="rp-break-all rp-z-[1] rp-p-3 rp-w-[50px] rp-h-[50px] rp-absolute rp-right-0 rp-bg-white dark:rp-bg-dark rp-rounded-xl"
            style={{
              boxShadow: 'var(--rp-shadow-3)',
              ...popperStyle,
            }}
          >
            <img src={content} alt="img" />
          </div>
        ) : null}
      </div>
    );
  }
  if (mode === 'dom') {
    return (
      <div
        className={`${styles.socialLinksIcon} rp-cursor-pointer rp-relative`}
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div
            className="rp-break-all rp-z-[1] rp-p-3 rp-absolute rp-right-0 rp-bg-white dark:rp-bg-dark rp-rounded-xl"
            style={{
              boxShadow: 'var(--rp-shadow-3)',
              ...popperStyle,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : null}
      </div>
    );
  }

  return <div></div>;
};
