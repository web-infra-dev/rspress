import { useRef, useState } from 'react';
import { SidebarMenu } from '.';
import { useClickOutside } from './useClickOutside';

function useSidebarMenu() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const sidebarLayoutRef = useRef<HTMLDivElement>(null);
  const asideLayoutRef = useRef<HTMLDivElement>(null);

  useClickOutside([sidebarMenuRef, sidebarLayoutRef], () => {
    setIsSidebarOpen(false);
  });
  useClickOutside([sidebarMenuRef, asideLayoutRef], () => {
    setIsAsideOpen(false);
  });

  const sidebarMenu = (
    <SidebarMenu
      isSidebarOpen={isSidebarOpen}
      onIsSidebarOpenChange={setIsSidebarOpen}
      isAsideOpen={isAsideOpen}
      onIsAsideOpenChange={setIsAsideOpen}
      ref={sidebarMenuRef}
    />
  );

  return {
    sidebarMenu,
    isAsideOpen,
    isSidebarOpen,
    sidebarLayoutRef,
    asideLayoutRef,
  };
}

export { useSidebarMenu };
