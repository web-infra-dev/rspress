import {
  expect,
  test as baseTest,
  type PlaywrightOptions,
} from '@rstest/playwright';

const isCI = Boolean(process.env.CI);
// TODO: Replace this shim when https://github.com/web-infra-dev/rstest/issues/1654 is resolved.
const retryCounts = new WeakMap<object, number>();

export const test = baseTest.extend({
  playwright: async ({ onTestFailed, task }, use) => {
    const retryCount = retryCounts.get(task.meta) ?? 0;

    onTestFailed(() => {
      retryCounts.set(task.meta, retryCount + 1);
    });

    await use({
      launchOptions: isCI ? { channel: 'chrome' } : {},
      contextOptions: {
        viewport: { width: 1440, height: 900 },
      },
      trace: isCI ? (retryCount === 1 ? 'on' : 'off') : 'on',
    } satisfies PlaywrightOptions);
  },
});

export { expect };
export type { PlaywrightFixture } from '@rstest/playwright';
export type { Locator, Page } from 'playwright';
