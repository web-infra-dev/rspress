import type { Page } from '@playwright/test';

export async function getNavbar(page: Page) {
  // take the nav
  const nav = await page.$$('.rp-nav-menu');
  return nav;
}

export async function getNavbarItems(page: Page) {
  // take the nav
  const nav = await page.$$('.rp-nav-menu .rp-nav-menu__item');
  return nav;
}

export async function getSidebar(page: Page) {
  // take the sidebar, properly a section or a tag
  const sidebar = await page.$$('.rp-doc-layout__sidebar .rp-sidebar-item');
  return sidebar;
}

export async function getSidebarTexts(page: Page) {
  const sidebar = await getSidebar(page);
  const sidebarTexts = await Promise.all(
    sidebar.map(element => element.textContent()),
  );
  return sidebarTexts;
}
