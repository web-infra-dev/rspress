import { useLocaleSiteData } from './useLocaleSiteData';
import { useVersion } from './useVersion';

export function useNav() {
  const { nav } = useLocaleSiteData();
  const version = useVersion();
  // Normalize the nav item links to include the version prefix
  if (Array.isArray(nav)) {
    return nav;
  }

  const navKey = version.length > 0 ? version : 'default';
  return [...nav![navKey]];
}
