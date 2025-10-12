import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('github alert syntax in mdx-js', async () => {
  let appPort;
  let app;
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
    await page.goto(`http://localhost:${appPort}`);

    const topLevelDirectives = page.locator(
      '.rspress-doc > [class^="rspress-directive"]',
    );
    await expect(topLevelDirectives).toHaveCount(7);

    const listDirectives = page.locator(
      '.rspress-doc > * > li > [class^="rspress-directive"]',
    );
    await expect(listDirectives).toHaveCount(2);

    const stepsDirectives = page.locator(
      '.rspress-doc > .\\[counter-reset\\:step\\] * > li > [class^="rspress-directive"]',
    );
    await expect(stepsDirectives).toHaveCount(2);

    const allDirectives = [topLevelDirectives, listDirectives, stepsDirectives];
    const containerTypes: string[] = [];

    for (const directivesLocator of allDirectives) {
      const count = await directivesLocator.count();
      for (let i = 0; i < count; i++) {
        const className = await directivesLocator.nth(i).getAttribute('class');
        containerTypes.push(className?.split(' ')[1] || '');
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
