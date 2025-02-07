import { useLocation } from '@rspress/runtime';
import { useMemo } from 'react';
import {
  type SidebarDataGroup,
  getSidebarDataGroup,
} from './getSidebarDataGroup';
import { useLocaleSiteData } from './useLocaleSiteData';

export function useSidebarData(): SidebarDataGroup {
  const { sidebar } = useLocaleSiteData();
  const { pathname: rawPathname } = useLocation();
  const pathname = decodeURIComponent(rawPathname);

  const sidebarData = useMemo(() => {
    return getSidebarDataGroup(sidebar, pathname);
  }, [sidebar, pathname]);

  return sidebarData;
}
