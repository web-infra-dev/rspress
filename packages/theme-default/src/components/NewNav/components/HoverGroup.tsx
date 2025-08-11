import type { NavItemWithChildren } from '@rspress/shared';
import cls from 'clsx';
import { useNavigate } from '../../Link/useNavigate';
import {
  active,
  container,
  hidden,
  item as itemClass,
} from './HoverGroup.module.scss';

type Items = NavItemWithChildren['items'];

interface HoverGroupProps {
  items: Items;
  isOpen: boolean;
  activeMatcher?: (item: Items[number]) => boolean;
}

function HoverGroup({ items, isOpen, activeMatcher }: HoverGroupProps) {
  const navigate = useNavigate();
  return (
    <ul className={cls(container, { [hidden]: !isOpen })}>
      {items.map(item => {
        const { text, link } = item;
        const isActiveItem = activeMatcher ? activeMatcher(item) : false;

        return (
          <li
            key={text + link}
            className={cls(itemClass, { [active]: isActiveItem })}
            onClick={() => {
              navigate(link);
            }}
          >
            {text}
          </li>
        );
      })}
    </ul>
  );
}

export { HoverGroup };
export type { HoverGroupProps, Items };
