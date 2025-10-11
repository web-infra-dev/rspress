import { SocialLinks, SvgWrapper, useHoverGroup } from '@theme';
import SmallMenu from '@theme-assets/small-menu';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { NavVersions } from '../NewNav/NavMenu';
import { NavScreen, NavScreenDivider } from '../NewNavScreen';
import { NavScreenAppearance } from '../NewNavScreen/NavScreenAppearance';
import { NavScreenLangs } from '../NewNavScreen/NavScreenLangs';
import './index.scss';
import { useNavScreen } from './useNavScreen';

export function NavHamburger() {
  const items = (
    <div className="rp-nav-hamburger__md__hover-group">
      <NavScreenLangs />
      <NavVersions />
      <NavScreenAppearance />
      <NavScreenDivider />
      <SocialLinks />
    </div>
  );
  const { isScreenOpen, toggleScreen } = useNavScreen();

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    position: 'right',
    customChildren: (
      <div className="rp-nav-menu__others-mobile__container">{items}</div>
    ),
  });

  return (
    <>
      {typeof window !== 'undefined' &&
        createPortal(
          <NavScreen isScreenOpen={isScreenOpen} toggleScreen={toggleScreen} />,
          document.getElementById('__rspress_modal_container')!,
        )}

      <button
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__sm', {
          'rp-nav-hamburger--active': isScreenOpen,
        })}
      >
        <SvgWrapper icon={SmallMenu} />
      </button>

      <button
        aria-label="mobile hamburger"
        className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__md', {
          'rp-nav-hamburger--active': isScreenOpen,
        })}
        onClick={handleMouseEnter}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SvgWrapper icon={SmallMenu} />
        {hoverGroup}
      </button>
    </>
  );
}
