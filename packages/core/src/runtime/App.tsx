'use client';

import { PageContext, useLocation } from '@rspress/core/runtime';
import { useContext, useLayoutEffect } from 'react';
import { AppShell } from './AppShell';
import { initPageData } from './initPageData';

export function App() {
  const { setData: setPageData } = useContext(PageContext);
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    async function refetchData() {
      try {
        const pageData = await initPageData(pathname);
        setPageData?.(pageData);
      } catch (e) {
        console.log(e);
      }
    }
    refetchData();
  }, [pathname, setPageData]);

  return <AppShell />;
}
