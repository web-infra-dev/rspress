import type { DefaultThemeConfig, SiteData } from '@rspress/shared';
import SmallMenu from '@theme-assets/small-menu';
import { useNavScreen } from '../../logic/useNav';
import { NavScreen } from '../NavScreen';
import { SvgWrapper } from '../SvgWrapper';
import * as styles from './index.module.scss';

interface Props {
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

export function NavHamburger(props: Props) {
  const { siteData, pathname } = props;
  const { isScreenOpen, toggleScreen } = useNavScreen();
  return (
    <>
      <NavScreen
        isScreenOpen={isScreenOpen}
        toggleScreen={toggleScreen}
        siteData={siteData}
        pathname={pathname}
      />
      <button
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={`${isScreenOpen ? styles.active : ''} rspress-mobile-hamburger ${
          styles.navHamburger
        } rp-text-gray-500`}
      >
        <SvgWrapper icon={SmallMenu} fill="currentColor" />
      </button>
    </>
  );
}
