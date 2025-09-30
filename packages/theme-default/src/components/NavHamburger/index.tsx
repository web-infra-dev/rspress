import SmallMenu from '@theme-assets/small-menu';
import { createPortal } from 'react-dom';
import { NavScreen } from '../NavScreen';
import { SvgWrapper } from '../SvgWrapper';
import * as styles from './index.module.scss';
import { useNavScreen } from './useNavScreen';

export function NavHamburger() {
  const { isScreenOpen, toggleScreen } = useNavScreen();
  return (
    <>
      {createPortal(
        <NavScreen isScreenOpen={isScreenOpen} toggleScreen={toggleScreen} />,
        document.getElementById('__rspress_modal_container')!,
      )}
      <button
        onClick={toggleScreen}
        aria-label="mobile hamburger"
        className={`${isScreenOpen ? styles.active : ''} rspress-mobile-hamburger ${
          styles.navHamburger
        } rp-text-gray-500`}
      >
        <SvgWrapper
          icon={SmallMenu}
          fill="currentColor"
          className={`${isScreenOpen ? 'rp-bg-gray-200' : 'hover:rp-bg-gray-100'}`}
        />
      </button>
    </>
  );
}
