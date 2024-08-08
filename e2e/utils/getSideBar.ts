import type { Page } from '@playwright/test';

async function getNavbar(page: Page) {
  // take the nav
  const nav = await page.$$('.rspress-nav-menu');
  return nav;
}

async function getSidebar(page: Page) {
  // take the sidebar, properly a section or a tag
  const sidebar = await page.$$(
    `.rspress-sidebar .rspress-scrollbar > nav > section,
     .rspress-sidebar .rspress-scrollbar > nav > a`,
  );
  return sidebar;
}

export { getNavbar, getSidebar };
