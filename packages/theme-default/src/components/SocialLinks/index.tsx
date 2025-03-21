import type { SocialLink } from '@rspress/shared';
import { useCallback, useState } from 'react';
import { HiddenLinks } from './HiddenLinks';
import { ShownLinks } from './ShownLinks';
import * as styles from './index.module.scss';

const MORE_LENGTH = 5;

export const SocialLinks = ({ socialLinks }: { socialLinks: SocialLink[] }) => {
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
    <div
      className={`social-links ${styles.menuItem} rp-flex-center rp-relative`}
      onMouseLeave={hide}
    >
      <ShownLinks
        links={shownLinks}
        moreIconVisible={isMore}
        mouseEnter={show}
      />
      {hiddenLinksVisible ? <HiddenLinks links={hiddenLinks} /> : null}
    </div>
  );
};
