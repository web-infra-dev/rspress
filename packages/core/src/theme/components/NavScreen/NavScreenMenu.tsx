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
  const firstLeft = menuItems.findIndex(item => item.position === 'left');
  const lastLeft = menuItems.findLastIndex(item => item.position === 'left');
  const firstRight = menuItems.findIndex(item => item.position !== 'left');
  const lastRight = menuItems.findLastIndex(item => item.position !== 'left');

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
