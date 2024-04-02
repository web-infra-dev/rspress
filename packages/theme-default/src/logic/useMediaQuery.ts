import { useEffect, useState } from 'react';

/**
 * Wrapper of CSS Media Query API
 */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    return typeof window !== 'undefined'
      ? window.matchMedia(query).matches
      : false;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
