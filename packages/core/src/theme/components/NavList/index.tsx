import type { NavItem } from '@rspress/core';
import { useContext } from 'react';
import { NavMenu } from '../Nav/NavMenu';
import { NavScreenMenu } from '../NavScreen/NavScreenMenu';
import { NavListContext } from './context';

export interface NavListProps {
  items: NavItem[];
}

/** Renders navigation items using the surrounding navigation's presentation. */
export function NavList({ items }: NavListProps) {
  const presentation = useContext(NavListContext);
  return presentation === 'screen' ? (
    <NavScreenMenu menuItems={items} />
  ) : (
    <NavMenu menuItems={items} />
  );
}
