import type {
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/shared';
import { Link, Tag } from '@theme';
import * as styles from './index.module.scss';

interface Props {
  pathname: string;
  langs?: string[];
  rightIcon?: React.ReactNode;
  onClick?: () => void;
}

export function NavMenuSingleItem(
  item: (NavItemWithLink | NavItemWithLinkAndChildren) & Props,
) {
  const { pathname } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(pathname);

  return (
    <Link href={item.link} onClick={item.onClick}>
      <div
        key={item.text}
        className={`rspress-nav-menu-item ${styles.singleItem} ${
          isActive ? `${styles.activeItem} rspress-nav-menu-item-active` : ''
        } rp-text-sm rp-font-medium rp-mx-0.5 rp-px-3 rp-py-2 rp-flex rp-items-center`}
      >
        <Tag tag={item.tag} />
        {item.text}
        {item.rightIcon}
      </div>
    </Link>
  );
}
