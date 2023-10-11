import { throttle } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';
import { useLocation, usePageData } from '@/runtime';

// The two hooks has the similar name, but they are quite different.
// `useDisableNav` is used to determine whether the navigation bar is disabled. It depends on both the frontmatter and the themeConfig.
// `useHiddenNav` is used to determine whether the navigation bar is hidden. It depends on the themeConfig and the scroll event.

export function useDisableNav() {
  const {
    siteData: { themeConfig },
    page: { frontmatter = {} },
  } = usePageData();
  // Priority: frontmatter.navbar > themeConfig.hideNavbar
  return !(frontmatter?.navbar ?? true) || themeConfig?.hideNavbar === 'always';
}

export function useHiddenNav() {
  const {
    siteData: { themeConfig },
  } = usePageData();
  const hiddenBehaivor = themeConfig.hideNavbar ?? 'never';
  const [hiddenNav, setHiddenNav] = useState(false);
  const { pathname } = useLocation();
  const lastScrollTop = useRef(0);

  if (hiddenBehaivor === 'never') {
    return false;
  } else if (hiddenBehaivor === 'always') {
    return true;
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setHiddenNav(false);
      const onScrollListen = throttle(() => {
        const { scrollTop } = document.documentElement;
        if (scrollTop === lastScrollTop.current) {
          return;
        }
        const shouldHidden =
          lastScrollTop.current > 0 && scrollTop - lastScrollTop.current > 0;
        setHiddenNav(shouldHidden);
        lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
      }, 200);

      window.addEventListener('mousewheel', onScrollListen);

      return () => {
        window.removeEventListener('mousewheel', onScrollListen);
      };
    }, [pathname]);

    return hiddenNav;
  }
}
