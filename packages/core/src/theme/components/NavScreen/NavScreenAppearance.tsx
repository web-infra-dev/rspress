import { NoSSR, useSite } from '@rspress/core/runtime';
import { SwitchAppearance } from '@theme';
import './NavScreenAppearance.scss';

export function NavScreenAppearance() {
  const { site } = useSite();
  const hasAppearanceSwitch = site.themeConfig.darkMode !== false;
  return (
    <>
      {hasAppearanceSwitch && (
        <div className="rp-nav-screen-appearance">
          <div className="rp-nav-screen-appearance__left">Theme</div>
          <div className="rp-nav-screen-appearance__right">
            <NoSSR>
              <SwitchAppearance />
            </NoSSR>
          </div>
        </div>
      )}
    </>
  );
}
