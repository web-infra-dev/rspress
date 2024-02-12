import { Fragment } from 'react';
import type { SiteData, DefaultThemeConfig } from '@rspress/shared';
import { NavScreen } from '../NavScreen';
import { useNavScreen } from '../../logic/useNav';
import SmallMenu from '../../assets/small-menu.svg';
import styles from './index.module.scss';

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
        <SmallMenu fill="currentColor" />
      </button>
    </Fragment>
  );
}
