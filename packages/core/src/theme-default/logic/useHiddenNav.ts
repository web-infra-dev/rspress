import { throttle } from 'lodash-es';
import { useEffect, useState } from 'react';

export function useHiddenNav() {
  const [hiddenNav, setHiddenNav] = useState(false);
  useEffect(() => {
    let lastScrollTop = 0;
    const onScrollListen = throttle(() => {
      const { scrollTop } = document.documentElement;
      const downScroll =
        scrollTop > 100 && lastScrollTop > 0 && scrollTop > lastScrollTop;
      setHiddenNav(downScroll);
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, 100);

    window.addEventListener('mousewheel', onScrollListen);

    return () => {
      window.removeEventListener('mousewheel', onScrollListen);
    };
  }, []);

  return hiddenNav;
}
