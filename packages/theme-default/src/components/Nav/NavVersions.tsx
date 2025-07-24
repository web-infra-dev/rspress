import * as styles from './index.module.scss';
import { useVersionMenuData } from './menuDataHooks';
import { NavMenuGroup } from './NavMenuGroup';

export function NavVersions() {
  const versionsMenuData = useVersionMenuData();
  return (
    <div
      className={`translation ${styles.menuItem} rp-flex rp-text-sm rp-font-bold rp-items-center rp-px-3 rp-py-2`}
    >
      <div>
        <NavMenuGroup {...versionsMenuData} />
      </div>
    </div>
  );
}
