import {
  type NormalizedSidebarGroup,
  type SidebarItem,
  type NormalizedSidebar,
  type SidebarDivider,
  addTrailingSlash,
} from '@rspress/shared';
import { useEffect, useState } from 'react';
import { useLocation, withBase, isEqualPath } from '@rspress/runtime';
import { useLocaleSiteData } from './useLocaleSiteData';

interface SidebarData {
  // The group name for the sidebar
  group: string;
  items: (NormalizedSidebarGroup | SidebarItem | SidebarDivider)[];
}

export const getSidebarGroupData = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
) => {
  let detectedGroupName;
  for (const name of Object.keys(sidebar)) {
    if (detectedGroupName && detectedGroupName !== name) {
      continue;
    }
    if (isEqualPath(withBase(name), currentPathname)) {
      // Such as `/api/`，it will return all the sidebar group
      return {
        group: 'Documentation',
        items: sidebar[name],
      };
    }
    // Such as `/guide/getting-started`, it will return the guide groups and the group name `Introduction`
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    const result = sidebar[name].find(group => {
      const match = (
        item: NormalizedSidebarGroup | SidebarItem | SidebarDivider,
      ): boolean => {
        // Fix https://github.com/web-infra-dev/rspress/issues/241
        // For example, there is the following sidebar:
        // {
        //   '/guide/': [
        //     {
        //       text: 'Introduction',
        //       link: '/misc/team',
        //     },
        //     {
        //       text: 'Getting Started',
        //       link: '/xyz/getting-started',
        //     },
        //   ],
        //   '/misc/': [
        //     {
        //       ...
        //     }
        //   ]
        // }
        // The /misc/team will match the /misc/ group instead of the /guide/ group
        // However, if the current path is /xyz/getting-started, it will match the /guide/ group because there isn't any other group that matches the current path
        if (!currentPathname.startsWith(withBase(name))) {
          for (const otherGroupName of Object.keys(sidebar)) {
            if (
              otherGroupName !== name &&
              currentPathname.startsWith(
                // https://github.com/web-infra-dev/rspress/issues/360
                // Ensure the other group name ends with `/` to avoid some unexpected results, for example, `/react-native` will match `/react`, that's not what we want
                addTrailingSlash(withBase(otherGroupName)),
              )
            ) {
              // Performance optimization, once we find the other group name, we can skip the other group in the future loops
              detectedGroupName = otherGroupName;
              return false;
            }
          }
        }
        const equalFunc = () =>
          'link' in item &&
          item.link !== '' &&
          isEqualPath(withBase(item.link), currentPathname);

        if ('items' in item) {
          // If the current path is the same as the group link, return true
          if (equalFunc()) {
            return true;
          }
          return item.items.some(i => match(i));
        }

        return equalFunc();
      };

      return match(group);
    });

    if (result) {
      const sidebarGroup = sidebar[name];
      return {
        group: ('text' in result && result.text) || '',
        items: sidebarGroup,
      };
    }
  }
  return {
    group: 'Documentation',
    items: [],
  };
};
export function useSidebarData(): SidebarData {
  const localeData = useLocaleSiteData();
  const sidebar = localeData.sidebar ?? {};
  const { pathname: rawPathname } = useLocation();
  const pathname = decodeURIComponent(rawPathname);
  const [sidebarData, setSidebarData] = useState<SidebarData>(
    getSidebarGroupData(sidebar, pathname),
  );
  useEffect(() => {
    const newSidebarData = getSidebarGroupData(sidebar, pathname);
    setSidebarData(newSidebarData);
  }, [pathname, localeData.lang]);

  return sidebarData;
}
