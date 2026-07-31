import {
  expect,
  test as baseTest,
  type PlaywrightOptions,
} from '@rstest/playwright';

const isCI = Boolean(process.env.CI);

export const test = baseTest.extend({
  playwright: {
    launchOptions: isCI ? { channel: 'chrome' } : {},
    contextOptions: {
      viewport: { width: 1440, height: 900 },
    },
    trace: isCI ? 'retain-on-failure' : 'on',
  } satisfies PlaywrightOptions,
});

export { expect };
export type { PlaywrightFixture } from '@rstest/playwright';
export type { Locator, Page } from 'playwright';
