import {
  expect,
  test as baseTest,
  type PlaywrightOptions,
} from '@rstest/playwright';

const isCI = Boolean(process.env.CI);

export const test = baseTest.extend({
  playwright: async ({ task }, use) => {
    await use({
      // Windows uses Playwright's pinned headless shell instead of system Chrome.
      launchOptions:
        isCI && process.platform !== 'win32' ? { channel: 'chrome' } : {},
      contextOptions: {
        viewport: { width: 1440, height: 900 },
      },
      trace: isCI ? (task.retryCount === 1 ? 'on' : 'off') : 'on',
    } satisfies PlaywrightOptions);
  },
});

export { expect };
export type { PlaywrightFixture } from '@rstest/playwright';
export type { Locator, Page } from 'playwright';
