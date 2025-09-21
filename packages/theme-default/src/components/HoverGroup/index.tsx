import type { NavItemWithChildren } from '@rspress/shared';
import { Link } from '@theme';
import cls from 'clsx';
import './index.scss';

type Items = NavItemWithChildren['items'];

interface HoverGroupProps {
  items: Items;
  isOpen: boolean;
  activeMatcher?: (item: Items[number]) => boolean;
}

function HoverGroup({ items, isOpen, activeMatcher }: HoverGroupProps) {
  return (
    <ul
      className={cls('rp-hover-group', { 'rp-hover-group--hidden': !isOpen })}
    >
      {items.map(item => {
        const { text, link } = item;
        const isActiveItem = activeMatcher ? activeMatcher(item) : false;

        return (
          <li
            key={text + link}
            className={cls('rp-hover-group__item', {
              'rp-hover-group__item--active': isActiveItem,
            })}
          >
            <Link href={link}>{text}</Link>
          </li>
        );
      })}
    </ul>
  );
}

export { HoverGroup };
export type { HoverGroupProps, Items };
