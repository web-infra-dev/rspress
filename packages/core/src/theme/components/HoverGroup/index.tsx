import type { NavItemWithChildren } from '@rspress/core';
import { Link } from '@theme';
import cls from 'clsx';
import './index.scss';

type Items = NavItemWithChildren['items'];

interface HoverGroupProps {
  items?: Items;
  customChildren?: React.ReactNode;

  isOpen: boolean;
  /**
   * @default center
   */
  position?: 'left' | 'center' | 'right';
  activeMatcher?: (item: Items[number]) => boolean;
}

function HoverGroup({
  items,
  customChildren,
  isOpen,
  position = 'center',
  activeMatcher,
}: HoverGroupProps) {
  return (
    <ul
      className={cls('rp-hover-group', {
        'rp-hover-group--hidden': !isOpen,
        'rp-hover-group--left': position === 'left',
        'rp-hover-group--center': position === 'center',
        'rp-hover-group--right': position === 'right',
      })}
    >
      {customChildren ??
        items?.map(item => {
          const { text, link } = item;
          const isActiveItem = activeMatcher ? activeMatcher(item) : false;

          return (
            <li
              key={text + link}
              className={cls('rp-hover-group__item', {
                'rp-hover-group__item--active': isActiveItem,
              })}
            >
              <Link
                href={link}
                aria-label={text}
                className="rp-hover-group__item__link"
              >
                {text}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

export { HoverGroup };
export type { HoverGroupProps, Items };
