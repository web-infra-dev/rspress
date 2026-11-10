import type { NavItem } from '@rspress/core';
import { Fragment } from 'react';
import type { NavItemsSlots } from '../Nav';
import { NavScreenMenuItem } from './NavScreenMenuItem';
import './NavScreenMenu.scss';

export function NavScreenMenu({
  menuItems,
  beforeLeftNavItems,
  afterLeftNavItems,
  beforeRightNavItems,
  afterRightNavItems,
}: { menuItems: NavItem[] } & NavItemsSlots) {
  let firstLeft = -1;
  let lastLeft = -1;
  let firstRight = -1;
  let lastRight = -1;
  menuItems.forEach((item, index) => {
    if (item.position === 'left') {
      if (firstLeft === -1) firstLeft = index;
      lastLeft = index;
    } else {
      if (firstRight === -1) firstRight = index;
      lastRight = index;
    }
  });

  return (
    <>
      {/* Keep configured item order, including interleaved left/right items. */}
      {firstLeft === -1 ? (
        <>
          {beforeLeftNavItems}
          {afterLeftNavItems}
        </>
      ) : null}
      {menuItems.map((item, index) => (
        <Fragment key={index}>
          {index === firstLeft ? beforeLeftNavItems : null}
          {index === firstRight ? beforeRightNavItems : null}
          <NavScreenMenuItem menuItem={item} />
          {index === lastLeft ? afterLeftNavItems : null}
          {index === lastRight ? afterRightNavItems : null}
        </Fragment>
      ))}
      {firstRight === -1 ? (
        <>
          {beforeRightNavItems}
          {afterRightNavItems}
        </>
      ) : null}
    </>
  );
}
