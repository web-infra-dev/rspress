import {
  NavItemWithLink,
  NavItemWithLinkAndChildren,
  withoutBase,
} from '@rspress/shared';
import { Link } from '../Link';
import { Tag } from '../Tag';
import styles from './index.module.scss';
import { normalizeHrefInRuntime as normalizeHref } from '@/runtime';

interface Props {
  pathname: string;
  langs?: string[];
  base: string;
  rightIcon?: React.ReactNode;
}

export function NavMenuSingleItem(
  item: (NavItemWithLink | NavItemWithLinkAndChildren) & Props,
) {
  const { pathname, base } = item;
  const isActive = new RegExp(item.activeMatch || item.link).test(
    withoutBase(pathname, base),
  );

  return (
    <Link href={normalizeHref(item.link)}>
      <div
        key={item.text}
        className={`${styles.singleItem} ${
          isActive ? styles.activeItem : ''
        } text-sm font-medium mx-1.5 px-3 py-2 flex items-center`}
      >
        <Tag tag={item.tag} />
        {item.text}
        {item.rightIcon}
      </div>
    </Link>
  );
}
