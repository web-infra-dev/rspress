import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-image');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  const getImgUrl = (width: number) => {
    return `http://localhost:${appPort}/_rsbuild/ipx/f_auto,w_${width},q_75/static/assets/crab.56ca717f.png`;
  };

  test('Should render the element', async ({ page, context }) => {
    await page.setViewportSize({ width: 400, height: 900 });

    context.route(/\.png$/, async route => {
      await delay(1_000);
      route.continue();
    });

    await page.goto(`http://localhost:${appPort}/`);
    const img = page.getByAltText('A Cute Crab').first();

    await expect(img).toHaveCSS(
      'background-image',
      /^url\("data:image\/svg\+xml;/,
    );

    await page.waitForLoadState('networkidle');
    await expect(img).toHaveCSS('background-image', 'none');

    await expect(img).toHaveJSProperty('currentSrc', getImgUrl(640));

    await page.setViewportSize({ width: 1920, height: 1080 });

    await expect(img).toHaveJSProperty('currentSrc', getImgUrl(1080));
  });
});
