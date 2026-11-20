import {
  expect,
  test as baseTest,
  type PlaywrightOptions,
} from '@rstest/playwright';

const isCI = Boolean(process.env.CI);

export const test = baseTest.extend({
  playwright: async (_context, use) => {
    await use({
      launchOptions: isCI ? { channel: 'chrome' } : {},
      contextOptions: {
        viewport: { width: 1440, height: 900 },
      },
      // Keep the original failure, even when a later retry passes.
      trace: isCI ? 'retain-on-failure' : 'on',
    } satisfies PlaywrightOptions);
  },
});

export { expect };
export type { PlaywrightFixture } from '@rstest/playwright';
export type { Locator, Page } from 'playwright';
