import { throttle } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';

export function useHiddenNav() {
  const [hiddenNav, setHiddenNav] = useState(false);
  const lastScrollTop = useRef(0);
  useEffect(() => {
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
  }, []);

  return hiddenNav;
}
