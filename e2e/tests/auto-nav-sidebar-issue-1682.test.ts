import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar dir issue-1682', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar-issue-1682');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render sidebar with index convention correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/010.sub-directory/`, {
      waitUntil: 'networkidle',
    });

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(2);
    expect(sidebarTexts.join(',')).toEqual(
      ['Second sub-directorytest', 'First sub-directory'].join(','),
    );
  });
});
