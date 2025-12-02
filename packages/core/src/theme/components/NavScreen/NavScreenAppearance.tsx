import { NoSSR, useI18n, useSite } from '@rspress/core/runtime';
import { SwitchAppearance } from '@theme';
import './NavScreenAppearance.scss';
import { PREFIX } from '../../constant';

export function NavScreenAppearance() {
  const { site } = useSite();
  const hasAppearanceSwitch = site.themeConfig.darkMode !== false;
  const t = useI18n();
  return (
    <>
      {hasAppearanceSwitch && (
        <div className={`${PREFIX}nav-screen-appearance`}>
          <div className={`${PREFIX}nav-screen-appearance__left`}>
            {t('themeText')}
          </div>
          <div className={`${PREFIX}nav-screen-appearance__right`}>
            <NoSSR>
              <SwitchAppearance />
            </NoSSR>
          </div>
        </div>
      )}
    </>
  );
}
