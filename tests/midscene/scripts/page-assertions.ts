import type { Page } from 'playwright';

export async function expectLocation(
  page: Page,
  expected: { path: string; heading: string },
) {
  await page.waitForURL(url => url.pathname === expected.path);
  await page
    .getByRole('heading', { level: 1, name: expected.heading, exact: true })
    .waitFor({ state: 'visible' });
  await page.locator('.rp-nav-screen').waitFor({ state: 'hidden' });
}

export async function expectSearchResults(
  page: Page,
  expected: {
    query: string;
    count: number;
    firstContains: string;
    firstStartsWith?: string;
    firstEndsWith?: string;
  },
) {
  await page.locator('.rp-search-panel__input').waitFor({ state: 'visible' });
  // Read the rendered result text, including highlighted fragments, rather than
  // asking vision to distinguish small Japanese glyphs from their highlights.
  await page.waitForFunction(
    expected => {
      const input = document.querySelector<HTMLInputElement>(
        '.rp-search-panel__input',
      );
      const rows = document.querySelectorAll('.rp-suggest-item');
      const first = rows[0]?.querySelector(
        '.rp-suggest-item__header, .rp-suggest-item__statement',
      );
      const text = first?.textContent?.trim() ?? '';
      return (
        input?.value === expected.query &&
        rows.length === expected.count &&
        text.includes(expected.firstContains) &&
        (expected.firstStartsWith === undefined ||
          text.startsWith(expected.firstStartsWith)) &&
        (expected.firstEndsWith === undefined ||
          text.endsWith(expected.firstEndsWith))
      );
    },
    expected,
    { timeout: 10_000 },
  );
}

export async function expectOverviewLinks(page: Page, labels: string[]) {
  for (const label of labels) {
    const link = page.locator('.rp-overview').getByRole('link', {
      name: label,
      exact: true,
    });
    await link.waitFor({ state: 'visible' });
    const href = await link.getAttribute('href');
    if (!href || href === '#') {
      throw new Error(
        `Overview entry "${label}" has no navigation destination`,
      );
    }
  }
}
