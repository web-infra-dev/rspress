import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * @private
 * @unstable
 */
export function useScrollReset() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const decodedHash = decodeURIComponent(window.location.hash);
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);
  return;
}
