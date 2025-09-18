import type { Locator, Page } from '@playwright/test';

async function getSearchButton(page: Page): Promise<Locator> {
  return page.locator('.rp-flex > .rspress-nav-search-button');
}

/**
 * Search for text in the page and return suggestion items
 * @param page - The Playwright page instance
 * @param searchText - Text to search for
 * @param reset - Whether to clear the search input after searching
 * @returns Array of suggestion item locators
 */
export async function searchInPage(
  page: Page,
  searchText: string,
  reset = true,
): Promise<Locator[]> {
  const searchInputLoc = page.locator('.rspress-search-panel-input');
  const isSearchInputVisible = await searchInputLoc.isVisible();

  if (!isSearchInputVisible) {
    const searchButton = await getSearchButton(page);
    await searchButton.click();
    // Wait for search panel to appear
    await searchInputLoc.waitFor({ state: 'visible' });
  }

  // Ensure search input is editable before proceeding
  await searchInputLoc.waitFor({ state: 'attached' });
  await searchInputLoc.focus();
  await searchInputLoc.fill(searchText);

  // Wait for search suggestions to appear
  const suggestionsContainer = page.locator('.rspress-search-suggest-item');
  await suggestionsContainer
    .first()
    .waitFor({ state: 'visible', timeout: 5000 });

  const elements = await suggestionsContainer.all();

  // Reset search input if requested
  if (reset) {
    await searchInputLoc.clear();
  }

  return elements;
}
