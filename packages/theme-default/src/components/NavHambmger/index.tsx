import { Fragment } from 'react';
import type { SiteData, DefaultThemeConfig } from '@rspress/shared';
import SmallMenu from '@theme-assets/small-menu';
import { NavScreen } from '../NavScreen';
import { useNavScreen } from '../../logic/useNav';
import styles from './index.module.scss';
import { SvgWrapper } from '../SvgWrapper';

interface Props {
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

export function NavHamburger(props: Props) {
  const { siteData, pathname } = props;
  const { isScreenOpen, toggleScreen } = useNavScreen();
  return (
    <Fragment>
      <NavScreen
        isScreenOpen={isScreenOpen}
        siteData={siteData}
        pathname={pathname}
      />
      <button
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={`${isScreenOpen ? styles.active : ''} ${
          styles.navHamburger
        } text-gray-500`}
      >
        <SvgWrapper icon={SmallMenu} fill="currentColor" />
      </button>
    </Fragment>
  );
}
