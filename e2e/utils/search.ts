import assert from 'node:assert';
import type { Page } from '@playwright/test';

async function getSearchButton(page: Page) {
  const searchButton = await page.$('.rp-flex > .rspress-nav-search-button');
  return searchButton;
}

/**
 * @returns suggestItems domList
 */
export async function searchInPage(
  page: Page,
  searchText: string,
  reset = true,
) {
  const searchInputLoc = page.locator('.rspress-search-panel-input');
  const isSearchInputVisible = await searchInputLoc.isVisible();
  if (!isSearchInputVisible) {
    const searchButton = await getSearchButton(page);
    assert(searchButton);
    await searchButton.click();
    const searchInput = await page.$('.rspress-search-panel-input');
    assert(searchInput);
  }
  const searchInput = await page.$('.rspress-search-panel-input');
  assert(searchInput);
  const isEditable = await searchInput.isEditable();
  assert(isEditable);
  await searchInput.focus();
  await page.keyboard.type(searchText);
  await page.waitForTimeout(400);
  const elements = await page.$$('.rspress-search-suggest-item');

  // reset
  if (reset) {
    for (let i = 0; i < searchText.length; i++) {
      await page.keyboard.press('Backspace');
    }
  }
  return elements;
}
