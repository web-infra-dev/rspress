import { useVersionMenu } from '../Nav/hooks';
import { NavScreenMenuItemWithChildren } from './NavScreenMenuItem';

export function NavScreenVersions() {
  const { activeValue, items } = useVersionMenu();

  return items.length > 1 ? (
    <div className="rp-nav-screen__group-wrapper">
      <NavScreenMenuItemWithChildren
        menuItem={{ items, text: activeValue }}
        // activeMatcher={item => item.text === activeValue}
      />
    </div>
  ) : null;
}
