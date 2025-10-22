import assert from 'node:assert';
import type { Page } from '@playwright/test';

async function getSearchButton(page: Page) {
  const desktopButton = await page.$('.rp-search-button');
  if (desktopButton) {
    return desktopButton;
  }
  return page.$('.rp-search-button--mobile');
}

/**
 * @returns suggestItems domList
 */
export async function searchInPage(
  page: Page,
  searchText: string,
  reset = true,
) {
  const searchInputLoc = page.locator('.rp-search-panel__input');
  const isSearchInputVisible = await searchInputLoc.isVisible();
  if (!isSearchInputVisible) {
    const searchButton = await getSearchButton(page);
    assert(searchButton);
    await searchButton.click();
    await page.waitForSelector('.rp-search-panel__input');
  }
  const searchInput = await page.$('.rp-search-panel__input');
  assert(searchInput);
  const isEditable = await searchInput.isEditable();
  assert(isEditable);
  await searchInput.focus();
  await page.keyboard.type(searchText);
  await page.waitForTimeout(400);
  const elements = await page.$$('.rp-suggest-item');

  if (reset) {
    for (let i = 0; i < searchText.length; i++) {
      await page.keyboard.press('Backspace');
    }
  }
  return elements;
}
