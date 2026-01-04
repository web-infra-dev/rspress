import type { NavItemWithChildren } from '@rspress/core';
import { matchNavbar, useLocation } from '@rspress/core/runtime';
import { Link, Tag } from '@theme';
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

function HoverGroupItem({
  item,
  activeMatcher,
  depth = 0,
}: {
  item: Items[number];
  activeMatcher?: (item: Items[number]) => boolean;
  depth?: number;
}) {
  const { pathname } = useLocation();

  if ('items' in item && item.items && item.items.length > 0) {
    const hasLink = 'link' in item && item.link;

    return (
      <>
        {hasLink && (
          <li
            key={item.text}
            className="rp-hover-group__item"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
            data-depth={depth}
          >
            <Link
              href={item.link}
              aria-label={item.text}
              className="rp-hover-group__item__link"
            >
              {item.text}
              {'tag' in item && item.tag && <Tag tag={item.tag} />}
            </Link>
          </li>
        )}
        {item.items.map(subItem => (
          <HoverGroupItem
            key={subItem.text}
            item={subItem}
            activeMatcher={activeMatcher}
            depth={depth + 1}
          />
        ))}
      </>
    );
  }

  if ('link' in item) {
    const { text, link } = item;
    const isActiveItem = activeMatcher
      ? activeMatcher(item)
      : matchNavbar(item, pathname);

    return (
      <li
        key={text + link}
        className={cls('rp-hover-group__item', {
          'rp-hover-group__item--active': isActiveItem,
        })}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        data-depth={depth}
      >
        {link ? (
          <Link
            href={link}
            aria-label={text}
            className="rp-hover-group__item__link"
          >
            {text}
            {'tag' in item && item.tag && <Tag tag={item.tag} />}
          </Link>
        ) : (
          <div className="rp-hover-group__item__link">
            {text}
            {'tag' in item && item.tag && <Tag tag={item.tag} />}
          </div>
        )}
      </li>
    );
  }

  return (
    <li
      key={item.text}
      className="rp-hover-group__item"
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      data-depth={depth}
    >
      <div className="rp-hover-group__item__link">
        {item.text}
        {'tag' in item && item.tag && <Tag tag={item.tag} />}
      </div>
    </li>
  );
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
        items?.map(item => (
          <HoverGroupItem
            key={item.text}
            item={item}
            activeMatcher={activeMatcher}
          />
        ))}
    </ul>
  );
}

export { HoverGroup };
export type { HoverGroupProps, Items };
