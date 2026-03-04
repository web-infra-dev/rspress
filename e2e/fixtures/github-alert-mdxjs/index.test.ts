import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('github alert syntax in mdx-js', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should transform github alert syntax to contain syntax', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const topLevelCallouts = page.locator('.rspress-doc > .rp-callout');
    await expect(topLevelCallouts).toHaveCount(7);

    const listCallouts = page.locator(
      '.rspress-doc > ol li > .rp-callout, .rspress-doc > ul li > .rp-callout',
    );
    await expect(listCallouts).toHaveCount(2);

    const stepsCallouts = page.locator('.rp-steps .rp-callout');
    await expect(stepsCallouts).toHaveCount(2);

    const allCallouts = [topLevelCallouts, listCallouts, stepsCallouts];
    const containerTypes: string[] = [];

    for (const calloutsLocator of allCallouts) {
      const count = await calloutsLocator.count();
      for (let i = 0; i < count; i++) {
        const className = await calloutsLocator.nth(i).getAttribute('class');
        const modifier = className
          ?.split(' ')
          .find(name => name.startsWith('rp-callout--'));
        containerTypes.push(modifier?.replace('rp-callout--', '') || '');
      }
    }

    expect(containerTypes).toEqual([
      'tip',
      'note',
      'warning',
      'caution',
      'danger',
      'info',
      'details',
      'info',
      'warning',
      'info',
      'warning',
    ]);
  });
});
