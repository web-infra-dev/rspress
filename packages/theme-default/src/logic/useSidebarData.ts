import { useLocation } from '@rspress/runtime';
import { useMemo } from 'react';
import type { SidebarData } from '../components/Sidebar';
import { getSidebarDataGroup } from './getSidebarDataGroup';
import { useLocaleSiteData } from './useLocaleSiteData';

export function useSidebarData(): SidebarData {
  const { sidebar } = useLocaleSiteData();
  const { pathname: rawPathname } = useLocation();
  const pathname = decodeURIComponent(rawPathname);

  const sidebarData: SidebarData = useMemo(() => {
    return getSidebarDataGroup(sidebar, pathname);
  }, [sidebar, pathname]);

  return sidebarData;
}
