import * as styles from './index.module.scss';
import { useTranslationMenuData } from './menuDataHooks';
import { NavMenuGroup } from './NavMenuGroup';

export function NavTranslations() {
  const translationMenuData = useTranslationMenuData();
  return (
    <div
      className={`translation ${styles.menuItem} rp-flex rp-text-sm rp-font-bold rp-items-center rp-px-3 rp-py-2`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} />
      </div>
    </div>
  );
}
