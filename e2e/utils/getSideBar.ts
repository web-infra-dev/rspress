import type { Locator, Page } from '@playwright/test';

export function getNavbar(page: Page): Locator {
  // Query both nav menus (left + right) rendered in the layout
  return page.locator('.rp-nav-menu');
}

export function getNavbarItems(page: Page): Locator {
  // Query actual nav menu items
  return page.locator('.rp-nav-menu .rp-nav-menu__item');
}

export function getSidebar(page: Page): Locator {
  // Query all sidebar items including nested entries
  return page.locator('.rp-doc-layout__sidebar .rp-sidebar-item');
}

export async function getSidebarTexts(page: Page): Promise<string[]> {
  const sidebar = getSidebar(page);
  const texts = await sidebar.allTextContents();
  return texts
    .map(text => text.trim())
    .filter((text): text is string => text.length > 0);
}
