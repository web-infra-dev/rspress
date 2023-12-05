import type { Page } from '@playwright/test';

export function getShouldOpenNewPage<T>(
  page: Page,
  /** snapshot the new page object as it will be closed after this function */
  serializeNewPage: (page: Page) => T | PromiseLike<T>,
  timeout = 3000,
) {
  return async function shouldOpenNewPage(
    /** after this function executed, a new page should be created */
    shouldOpen: () => any,
  ) {
    const pPage = page.context().waitForEvent('page', { timeout });

    const oldUrl = page.url();

    await shouldOpen();
    const pUrlChange = page
      .waitForURL(url => url.href !== oldUrl, {
        timeout,
      })
      .then(
        () =>
          // for quick fail
          Promise.reject(
            new Error(
              `page shouldn't navigate, but navigated to ${page.url()}`,
            ),
          ),
        () => null,
      );

    await Promise.race([pPage, pUrlChange]);
    const newPage = await pPage;
    try {
      await newPage.waitForURL(/^https?:\/\//);
      return await serializeNewPage(newPage);
    } finally {
      newPage.close().then(null, () => null);
    }
  };
}
