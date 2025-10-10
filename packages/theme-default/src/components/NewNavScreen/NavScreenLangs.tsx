import { useLangsMenu } from '../NewNav/hooks';
import { NavScreenMenuItemWithChildren } from './NavScreenMenuItem';

export function NavScreenLangs() {
  const { items, activeValue } = useLangsMenu();

  return items.length > 1 ? (
    <div className="rp-nav-screen__group-wrapper">
      <NavScreenMenuItemWithChildren
        menuItem={{ text: activeValue, items }}
        activeMatcher={item => item.text === activeValue}
      />
    </div>
  ) : null;
}
