import { useCallback, useMemo, useRef, useState } from 'react';
import { HoverGroup, type Items } from '.';

function useHoverGroup(
  items: Items,
  activeMatcher?: (item: Items[number]) => boolean,
) {
  const closeTimerRef = useRef<number>(null);
  const [isOpen, setIsOpen] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsOpen(true);
    clearCloseTimer();
  }, [setIsOpen]);

  /**
   * Handle mouse leave event for the dropdown menu
   * Closes the menu after a 150ms delay to allow diagonal mouse movement
   * to the dropdown content area
   */
  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, [setIsOpen]);

  const hoverGroup = useMemo(() => {
    return (
      <HoverGroup items={items} isOpen={isOpen} activeMatcher={activeMatcher} />
    );
  }, [items, isOpen, activeMatcher]);

  return {
    hoverGroup,
    handleMouseEnter,
    handleMouseLeave,
  };
}

export { useHoverGroup };
