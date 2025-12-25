import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { isActive } from '../route';

export const useActiveMatcher = () => {
  const { pathname: rawPathname } = useLocation();

  const activeMatcher = useCallback(
    (link: string) => {
      const pathname = decodeURIComponent(rawPathname);
      return isActive(link, pathname);
    },
    [rawPathname],
  );

  return activeMatcher;
};
