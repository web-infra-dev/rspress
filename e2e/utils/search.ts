import assert from 'node:assert';
import type { Page } from '@playwright/test';

export async function getSearchButton(page: Page) {
  const searchButton = await page.$('.rspress-nav-search-button');
  return searchButton;
}

/**
 * @returns suggestItems domList
 */
export async function searchInPage(page: Page, searchText: string) {
  let searchInput = await page.$('.rspress-search-panel-input');
  if (!searchInput) {
    const searchButton = await getSearchButton(page);
    assert(searchButton);
    await searchButton.click();
    searchInput = await page.$('.rspress-search-panel-input');
    assert(searchInput);
  }
  const isEditable = await searchInput.isEditable();
  assert(isEditable);
  await searchInput.focus();
  await page.keyboard.type(searchText);
  await page.waitForTimeout(400);
  const elements = await page.$$('.rspress-search-suggest-item');

  // reset
  for (let i = 0; i < searchText.length; i++) {
    await page.keyboard.press('Backspace');
  }
  return elements;
}
