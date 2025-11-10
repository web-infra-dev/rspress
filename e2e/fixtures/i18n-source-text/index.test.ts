import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('i18n test', async () => {
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

  test('Language i18n.json text', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // test zh
    await page.click('text=简体中文');
    await expect(page.locator('text=被配置修改')).toHaveCount(1);
    await expect(page.locator('text=配置-文件')).toHaveCount(1);
    await expect(page.locator('text=配置-json')).toHaveCount(1);
    await expect(page.locator('text=配置-插件')).toHaveCount(1);
    await expect(page.locator('text=This text is only in English')).toHaveCount(
      1,
    );

    // test en
    await page.click('text=English');
    await expect(page.locator('text=Modified by configuration')).toHaveCount(1);
    await expect(page.locator('text=Configuration-file')).toHaveCount(1);
    await expect(page.locator('text=Configuration-json')).toHaveCount(1);
    await expect(page.locator('text=Configuration-plugin')).toHaveCount(1);
    await expect(page.locator('text=This text is only in English')).toHaveCount(
      1,
    );

    // test en_US
    await page.click('text=EN_US');
    await expect(page.locator('text=Modified by configuration')).toHaveCount(1);
    await expect(page.locator('text=Configuration-file')).toHaveCount(1);
    await expect(page.locator('text=Configuration-json')).toHaveCount(1);
    await expect(page.locator('text=Configuration-plugin')).toHaveCount(1);
    await expect(page.locator('text=This text is only in English')).toHaveCount(
      1,
    );
  });
});
