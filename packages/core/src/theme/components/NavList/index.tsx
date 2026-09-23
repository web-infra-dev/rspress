import type { NavItem } from '@rspress/core';
import { useContext } from 'react';
import { NavMenu, NavMenuItem } from '../Nav/NavMenu';
import { NavScreenMenu } from '../NavScreen/NavScreenMenu';
import { NavListContext } from './context';

export interface NavListProps {
  items: NavItem[];
}

/** Renders navigation items using the surrounding navigation's presentation. */
export function NavList({ items }: NavListProps) {
  const presentation = useContext(NavListContext);
  if (presentation === 'items') {
    return items.map((item, index) => (
      <NavMenuItem key={index} menuItem={item} />
    ));
  }
  return presentation === 'screen' ? (
    <NavScreenMenu menuItems={items} />
  ) : (
    <NavMenu menuItems={items} />
  );
}
