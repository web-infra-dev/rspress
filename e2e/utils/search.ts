import assert from 'node:assert';
import type { Page } from '@playwright/test';

async function getSearchButton(page: Page) {
  const searchButton = await page.$('.rspress-nav-search-button');
  return searchButton;
}

/**
 * @returns suggestItems domList
 */
export async function searchInPage(page: Page, searchText: string) {
  const searchButton = await getSearchButton(page);
  assert(searchButton);

  await searchButton.click();

  const searchInput = await page.$('.rspress-search-panel-input');
  assert(searchInput);
  const isEditable = await searchInput.isEditable();
  assert(isEditable);
  await searchInput.focus();
  await page.keyboard.type(searchText);
  await page.waitForTimeout(500);
  return await page.$$('.rspress-search-suggest-item');
}
