import { useState } from 'react';
import type { SocialLink } from '@rspress/shared';
import styles from './index.module.scss';
import presetIcons from './presetIcons';

interface ILinkContentComp {
  link: SocialLink;
  popperStyle?: Record<string, unknown>;
}

export const LinkContent = (props: ILinkContentComp) => {
  const { link, popperStyle = {} } = props;
  const { icon, mode = 'link', content } = link;

  let IconComp: React.ReactElement = null;
  if (typeof icon === 'object') {
    // eslint-disable-next-line react/no-danger
    IconComp = <div dangerouslySetInnerHTML={{ __html: icon.svg }}></div>;
  } else if (icon) {
    const iconLowerCase = icon.toLowerCase();
    IconComp =
      // redirect twitter's logo to `x`
      iconLowerCase === 'twitter' ? presetIcons.x : presetIcons[iconLowerCase];
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
        className={`${styles.socialLinksIcon} cursor-pointer relative mx-3`}
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
            className="z-[1] p-3 w-50 absolute right-0 bg-white dark:bg-dark"
          >
            <div className="text-md">{content}</div>
          </div>
        ) : null}
      </div>
    );
  }
  if (mode === 'img') {
    return (
      <div
        className={`${styles.socialLinksIcon} cursor-pointer relative`}
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div
            className="break-all z-[1] p-3 w-[50px] h-[50px] absolute right-0 bg-white dark:bg-dark rounded-xl"
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
        className={`${styles.socialLinksIcon} cursor-pointer relative`}
        onMouseEnter={mouseEnterIcon}
        onMouseLeave={mouseLeavePopper}
      >
        {IconComp}
        {contentVisible ? (
          <div
            className="break-all z-[1] p-3 absolute right-0 bg-white dark:bg-dark rounded-xl"
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
