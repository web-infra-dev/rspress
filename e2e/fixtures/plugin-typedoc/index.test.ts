import path from 'node:path';
import { expect, test } from '@e2e/test';
import { getNavbarItems, getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin-typedoc single entry', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = path.join(import.meta.dirname, 'single');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('preserves single-entry navigation and sidebar node counts', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/`, {
      waitUntil: 'networkidle',
    });

    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(6);
  });
});

test.describe('plugin-typedoc multi entries', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = path.join(import.meta.dirname, 'multi');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });
  test('preserves multi-entry navigation and sidebar node counts', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/`, {
      waitUntil: 'networkidle',
    });

    const navItems = getNavbarItems(page);
    await expect(navItems).toHaveCount(2);

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(10);
  });

  test('preserves the generated raw link destination', async ({ page }) => {
    await page.goto(
      `http://localhost:${appPort}/api/functions/raw-link.getRspressUrl.html`,
      {
        waitUntil: 'networkidle',
      },
    );
    await expect(
      page.locator('a[href="https://rspress.rs"]').first(),
    ).toHaveAttribute('href', 'https://rspress.rs');
  });
});
