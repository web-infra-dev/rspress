import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

function getPendingPromise() {
  let resolve;
  const promise = new Promise(r => {
    resolve = r;
  });
  return [promise, resolve];
}

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'view-transition');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Navigation with animation', async ({ page }) => {
    // If the animation is not triggered in 20 seconds, the test will fail
    test.setTimeout(20000);
    await page.goto(`http://localhost:${appPort}/guide`);
    const session = await page.context().newCDPSession(page);
    await session.send('Animation.enable');
    const [end, resolve] = getPendingPromise();
    session.on('Animation.animationStarted', payload => {
      expect(payload.animation.type).toMatch(/[CSSTransition|CSSAnimation]/);
      resolve();
    });
    const alinks = await page.locator('.rspress-nav-menu a').all();
    const secondLink = alinks[1];
    secondLink.click();
    await page.waitForURL('**/start**');
    await end;
  });
});
