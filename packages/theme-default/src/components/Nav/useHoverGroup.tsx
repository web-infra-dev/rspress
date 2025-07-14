import type { NavItemWithChildren } from '@rspress/shared';
import { Link } from '@theme';
import { useMemo, useRef, useState } from 'react';
import { container } from './HoverGroup.module.scss';

interface HoverGroupRawProps {
  items: NavItemWithChildren['items'];
}

function HoverGroupRaw({
  items,
  isOpen,
}: { items: NavItemWithChildren['items']; isOpen: boolean }) {
  return (
    <ul className={container}>
      {items.map(({ link, text }) => (
        <li key={text + link}>
          <Link href={link}>{text}</Link>
        </li>
      ))}
    </ul>
  );
}

function useHoverGroup({ items }: { items: NavItemWithChildren['items'] }) {
  const closeTimerRef = useRef<number>(null);
  const [isOpen, setIsOpen] = useState(false);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  /**
   * Handle mouse leave event for the dropdown menu
   * Closes the menu after a 150ms delay to allow diagonal mouse movement
   * to the dropdown content area
   */
  const handleMouseLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const HoverGroup = useMemo(() => {
    return <HoverGroupRaw items={items} isOpen={isOpen} />;
  }, [isOpen, items]);

  return {
    handleMouseLeave,
    HoverGroup,
  };
}
