import { useSite } from '@rspress/runtime';
import type { SocialLink } from '@rspress/shared';
import ArrowDown from '@theme-assets/arrow-down';
import { useCallback, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import { HiddenLinks } from './HiddenLinks';
import * as styles from './index.module.scss';
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

  const [hiddenLinksVisible, setHiddenLinksVisible] = useState(false);

  const hide = useCallback(() => {
    setHiddenLinksVisible(false);
  }, [setHiddenLinksVisible]);

  const show = useCallback(() => {
    setHiddenLinksVisible(true);
  }, [setHiddenLinksVisible]);

  return (
    <div className={styles.socialLinks} onMouseLeave={hide}>
      {shownLinks.map((item, index) => (
        <SocialLinkComp key={index} link={item} />
      ))}
      {isMore ? (
        <div onMouseEnter={show}>
          <SvgWrapper icon={ArrowDown} />
        </div>
      ) : null}
      {hiddenLinksVisible ? <HiddenLinks links={hiddenLinks} /> : null}
    </div>
  );
};
