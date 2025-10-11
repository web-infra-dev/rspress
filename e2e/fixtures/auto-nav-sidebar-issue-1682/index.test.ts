import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar dir issue-1682', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

  test('Should render sidebar with index convention correctly', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/010.sub-directory/`, {
      waitUntil: 'networkidle',
    });

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(3);
    expect(sidebarTexts.join(',')).toEqual(
      ['Second sub-directory', 'test', 'First sub-directory'].join(','),
    );
  });
});
