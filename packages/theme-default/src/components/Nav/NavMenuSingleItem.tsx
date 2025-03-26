import { normalizeHrefInRuntime as normalizeHref } from '@rspress/runtime';
import {
  type NavItemWithLink,
  type NavItemWithLinkAndChildren,
  withoutBase,
} from '@rspress/shared';
import { Link, Tag } from '@theme';
import * as styles from './index.module.scss';

interface Props {
  pathname: string;
  langs?: string[];
  base: string;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
}

export function NavMenuSingleItem(
  item: (NavItemWithLink | NavItemWithLinkAndChildren) & Props,
) {
  const { pathname, base } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(
    withoutBase(pathname, base),
  );

  return (
    <Link href={normalizeHref(item.link)} onClick={item.onClick}>
      <div
        key={item.text}
        className={`rspress-nav-menu-item ${styles.singleItem} ${
          isActive ? styles.activeItem : ''
        } rp-text-sm rp-font-medium rp-mx-0.5 rp-px-3 rp-py-2 rp-flex rp-items-center`}
      >
        <Tag tag={item.tag} />
        {item.text}
        {item.rightIcon}
      </div>
    </Link>
  );
}
