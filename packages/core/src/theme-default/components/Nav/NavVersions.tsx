import { replaceVersion } from '@rspress/shared';
import { NavMenuGroup } from './NavMenuGroup';
import styles from './index.module.scss';
import { useLocation, usePageData, useVersion } from '@/runtime';

export function NavVersions() {
  const { siteData } = usePageData();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const defaultVersion = siteData.multiVersion.default || '';
  const versions = siteData.multiVersion.versions || [];
  const { base } = siteData;
  const versionsMenuData = {
    items: versions.map(version => ({
      text: version,
      link: replaceVersion(
        pathname,
        {
          current: currentVersion,
          target: version,
          default: defaultVersion,
        },
        base,
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return (
    <div
      className={`translation ${styles.menuItem} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...versionsMenuData} />
      </div>
    </div>
  );
}
