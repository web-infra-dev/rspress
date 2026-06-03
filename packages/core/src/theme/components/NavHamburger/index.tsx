import {
  IconSmallMenu,
  SocialLinks,
  SvgWrapper,
  useHoverGroup,
} from '@rspress/core/theme';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { NavVersions } from '../Nav/NavMenu';
import { NavScreen, NavScreenDivider } from '../NavScreen';
import { NavScreenAppearance } from '../NavScreen/NavScreenAppearance';
import { NavScreenLangs } from '../NavScreen/NavScreenLangs';
import './index.scss';
import { useNavScreen } from './useNavScreen';

export function NavHamburger() {
  const items = (
    <div className="rp-nav-hamburger__md__hover-group">
      <NavScreenAppearance />
      <ul className="rp-nav-menu">
        <NavVersions />
      </ul>
      <NavScreenLangs />
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
      {isScreenOpen &&
        createPortal(
          <NavScreen isScreenOpen={isScreenOpen} toggleScreen={toggleScreen} />,
          document.getElementById('__rspress_modal_container')!,
        )}

      <button
        type="button"
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__sm', {
          'rp-nav-hamburger--active': isScreenOpen,
        })}
      >
        <SvgWrapper icon={IconSmallMenu} />
      </button>

      <div
        className="rp-nav-hamburger__md-wrapper"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={handleMouseEnter}
          aria-label="mobile hamburger"
          className={clsx('rp-nav-hamburger', 'rp-nav-hamburger__md', {
            'rp-nav-hamburger--active': isScreenOpen,
          })}
        >
          <SvgWrapper icon={IconSmallMenu} />
        </button>
        {hoverGroup}
      </div>
    </>
  );
}
