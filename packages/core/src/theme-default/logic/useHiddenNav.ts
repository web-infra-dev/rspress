import { throttle } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';
import { useLocation, usePageData } from '@/runtime';

export function useHiddenNav() {
  const {
    siteData: { themeConfig },
  } = usePageData();
  const hiddenBehaivor = themeConfig.hideNavbar ?? 'auto';
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
