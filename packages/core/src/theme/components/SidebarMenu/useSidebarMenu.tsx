import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SidebarMenu } from '.';
import { useClickOutside } from './useClickOutside';

function useSidebarMenu() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);

  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const sidebarLayoutRef = useRef<HTMLDivElement>(null);
  const asideLayoutRef = useRef<HTMLDivElement>(null);

  // only sidebar, body scroll lock can not work in iOS safari in aside
  useEffect(() => {
    sidebarMenuRef.current &&
      isSidebarOpen &&
      disableBodyScroll(sidebarMenuRef.current, {
        reserveScrollBarGap: true,
        allowTouchMove: () => true,
      });
    return () => {
      clearAllBodyScrollLocks();
    };
  }, [isSidebarOpen]);

  useClickOutside([sidebarMenuRef, sidebarLayoutRef], () => {
    setIsSidebarOpen(false);
  });
  useClickOutside([sidebarMenuRef, asideLayoutRef], () => {
    setIsOutlineOpen(false);
  });

  const sidebarMenu = useMemo(() => {
    return (
      <SidebarMenu
        isSidebarOpen={isSidebarOpen}
        onIsSidebarOpenChange={setIsSidebarOpen}
        isOutlineOpen={isOutlineOpen}
        onIsOutlineOpenChange={setIsOutlineOpen}
        ref={sidebarMenuRef}
      />
    );
  }, [isOutlineOpen, isSidebarOpen, setIsOutlineOpen, setIsSidebarOpen]);

  return {
    sidebarMenu,
    isOutlineOpen,
    isSidebarOpen,
    sidebarLayoutRef,
    asideLayoutRef,
  };
}

export { useSidebarMenu };
