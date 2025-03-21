import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/shared';
import { Link } from '@theme';
import Down from '@theme-assets/down';
import { useState } from 'react';
import * as styles from './index.module.scss';

export interface NavScreenMenuGroupItem {
  text?: string | React.ReactElement;
  items: NavItem[];
  activeValue?: string;
}

export function NavScreenMenuGroup(item: NavScreenMenuGroupItem) {
  const { activeValue } = item;
  const [isOpen, setIsOpen] = useState(false);

  function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
    return (
      <div className="rp-p-1 rp-text-center">
        <span className="rp-text-brand">{item.text}</span>
      </div>
    );
  }

  function NormalGroupItem({ item }: { item: NavItemWithLink }) {
    return (
      <div className="rp-py-1 rp-font-medium">
        <Link href={item.link}>
          <div>
            <div className="rp-flex rp-justify-center">
              <span>{item.text}</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  const renderLinkItem = (item: NavItemWithLink) => {
    if (activeValue === item.text) {
      return <ActiveGroupItem key={item.link} item={item} />;
    }
    return <NormalGroupItem key={item.link} item={item} />;
  };
  const renderGroup = (
    item: NavItemWithChildren | NavItemWithLinkAndChildren,
  ) => {
    return (
      <div>
        {'link' in item ? (
          renderLinkItem(item as NavItemWithLink)
        ) : (
          <p className="rp-font-bold rp-text-gray-400 rp-my-1 not:first:rp-border">
            {item.text}
          </p>
        )}
        {item.items.map(renderLinkItem)}
      </div>
    );
  };
  return (
    <div
      className={`${isOpen ? styles.open : ''} ${
        styles.navScreenMenuGroup
      } relative`}
    >
      <button
        className={styles.button}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span className={styles.buttonSpan}>{item.text}</span>
        <Down className={`${isOpen ? styles.open : ''} ${styles.down} `} />
      </button>
      <div>
        <div className={styles.items}>
          {/* The item could be a link or a sub group */}
          {item.items.map(item => {
            return (
              <div key={item.text}>
                {'items' in item ? renderGroup(item) : renderLinkItem(item)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
