import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('github alert syntax in mdx-js', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'github-alert-mdxjs');
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

    const topLevelDirectives = await page.$$(
      '.rspress-doc > [class^="rspress-directive"]',
    );

    expect(topLevelDirectives.length).toEqual(7);

    const listDirectives = await page.$$(
      '.rspress-doc > * > li > [class^="rspress-directive"]',
    );
    expect(listDirectives.length).toEqual(2);

    const stepsDirectives = await page.$$(
      '.rspress-doc > .\\[counter-reset\\:step\\] * > li > [class^="rspress-directive"]',
    );
    expect(stepsDirectives.length).toEqual(2);

    const containerTypes = await Promise.all(
      [...topLevelDirectives, ...listDirectives, ...stepsDirectives].map(
        async directive => {
          const className = await directive.getAttribute('class');
          return className?.split(' ')[1];
        },
      ),
    );
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
