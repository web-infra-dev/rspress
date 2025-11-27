import type { NavItemWithChildren } from '@rspress/core';
import { Link } from '@theme';
import cls from 'clsx';
import './index.scss';
import { PREFIX } from '../../constant';

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
      className={cls(`${PREFIX}hover-group`, {
        [`${PREFIX}hover-group--hidden`]: !isOpen,
        [`${PREFIX}hover-group--left`]: position === 'left',
        [`${PREFIX}hover-group--center`]: position === 'center',
        [`${PREFIX}hover-group--right`]: position === 'right',
      })}
    >
      {customChildren ??
        items?.map(item => {
          const { text, link } = item;
          const isActiveItem = activeMatcher ? activeMatcher(item) : false;

          return (
            <li
              key={text + link}
              className={cls(`${PREFIX}hover-group__item`, {
                [`${PREFIX}hover-group__item--active`]: isActiveItem,
              })}
            >
              <Link
                href={link}
                aria-label={text}
                className={`${PREFIX}hover-group__item__link`}
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
