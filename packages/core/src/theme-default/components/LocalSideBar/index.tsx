import { Fragment, useEffect, useState } from 'react';
import { SideBar } from '../Sidebar';
import MenuIcon from '../../assets/menu.svg';
import './index.scss';
import { useLocation } from '@/runtime';

export function SideMenu() {
  const [isSidebarOpen, setIsOpen] = useState<boolean>(false);
  const { pathname } = useLocation();

  function openSidebar() {
    setIsOpen(true);
  }

  function closeSidebar() {
    setIsOpen(false);
  }

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Fragment>
      <div className="rspress-sidebar-menu">
        <button onClick={openSidebar} className="flex-center">
          <div className="text-md mr-2">
            <MenuIcon />
          </div>
          <span className="text-sm">Menu</span>
        </button>
      </div>
      <SideBar isSidebarOpen={isSidebarOpen} />
      {isSidebarOpen ? (
        <div onClick={closeSidebar} className="rspress-sidebar-back-drop" />
      ) : null}
    </Fragment>
  );
}
