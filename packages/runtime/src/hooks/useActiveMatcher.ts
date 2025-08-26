import { useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isActive } from '../route';

export const useActiveMatcher = () => {
  const { pathname: rawPathname } = useLocation();

  const ref = useRef(rawPathname);
  ref.current = rawPathname;

  const activeMatcher = useCallback((link: string) => {
    const rawPathname = ref.current;
    const pathname = decodeURIComponent(rawPathname);
    return isActive(link, pathname);
  }, []);

  return activeMatcher;
};
