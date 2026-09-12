import type { NavItem } from '@rspress/core';
import { describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { NavScreenMenu } from './NavScreenMenu';

rs.mock('./NavScreenMenuItem', () => ({
  NavScreenMenuItem: ({ menuItem }: { menuItem: NavItem }) => (
    <span>{menuItem.text}</span>
  ),
}));

function renderOrder(items: NavItem[]) {
  return renderToStaticMarkup(
    <NavScreenMenu
      menuItems={items}
      beforeLeftNavItems={<span>BL</span>}
      afterLeftNavItems={<span>AL</span>}
      beforeRightNavItems={<span>BR</span>}
      afterRightNavItems={<span>AR</span>}
    />,
  ).match(/(?<=>)[^<]+(?=<)/g);
}

describe('mobile navigation slot placement', () => {
  it('preserves interleaved navigation order and wraps each position at its boundaries', () => {
    expect(
      renderOrder([
        { text: 'R1', link: '/' },
        { text: 'L1', link: '/', position: 'left' },
        { text: 'R2', link: '/', position: 'right' },
        { text: 'L2', link: '/', position: 'left' },
      ]),
    ).toEqual(['BR', 'R1', 'BL', 'L1', 'R2', 'AR', 'L2', 'AL']);
  });

  it('renders left slots before a right-only list', () => {
    expect(renderOrder([{ text: 'R', link: '/' }])).toEqual([
      'BL',
      'AL',
      'BR',
      'R',
      'AR',
    ]);
  });

  it('renders right slots after a left-only list', () => {
    expect(renderOrder([{ text: 'L', link: '/', position: 'left' }])).toEqual([
      'BL',
      'L',
      'AL',
      'BR',
      'AR',
    ]);
  });

  it('keeps all slots when no navigation items are configured', () => {
    expect(renderOrder([])).toEqual(['BL', 'AL', 'BR', 'AR']);
  });
});
