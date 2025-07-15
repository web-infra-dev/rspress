import type { NavItemWithChildren } from '@rspress/shared';
import { Link } from '@theme';
import cls from 'clsx';
import { container, hidden, item } from './HoverGroup.module.scss';

type Items = NavItemWithChildren['items'];

interface HoverGroupRawProps {
  items: Items;
  isOpen: boolean;
}

function HoverGroup({ items, isOpen }: HoverGroupRawProps) {
  return (
    <ul className={cls(container, { [hidden]: !isOpen })}>
      {items.map(({ link, text }) => (
        <li key={text + link} className={cls(item)}>
          <Link href={link}>{text}</Link>
        </li>
      ))}
    </ul>
  );
}

export { HoverGroup };
export type { HoverGroupRawProps, Items };
