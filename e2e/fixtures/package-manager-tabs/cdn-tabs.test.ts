import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('CDN tabs', () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;

  test.beforeAll(async () => {
    appPort = await getPort();
    app = await runDevCommand(import.meta.dirname, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('renders logos and highlighted HTML in both themes and synchronizes tabs', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/cdn-tabs`, {
      waitUntil: 'networkidle',
    });

    const tabs = page.locator('.rp-tabs').first();
    const labels = tabs.locator('.rp-tabs__label__item');
    await expect(labels).toHaveText(['jsDelivr', 'unpkg']);
    await expect(labels.locator('svg')).toHaveCount(2);

    const code = tabs.locator('.rp-tabs__content__item--active code');
    await expect(code).toHaveText(
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css" />\n' +
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/js/bootstrap.min.js"></script>',
    );
    await expect(code.locator('.line')).toHaveCount(2);

    const tag = code.locator('.line').first().locator('span').nth(0);
    const attribute = code.locator('.line').first().locator('span').nth(1);
    const value = code.locator('.line').first().locator('span').nth(2);
    for (const dark of [false, true]) {
      await page.locator('html').evaluate((element, dark) => {
        element.classList.toggle('rp-dark', dark);
      }, dark);
      const tagColor = await tag.evaluate(
        element => getComputedStyle(element).color,
      );
      const attributeColor = await attribute.evaluate(
        element => getComputedStyle(element).color,
      );
      const valueColor = await value.evaluate(
        element => getComputedStyle(element).color,
      );
      expect(new Set([tagColor, attributeColor, valueColor]).size).toBe(3);
      await expect(code.locator('.line').first()).toHaveCSS(
        'padding-left',
        '20px',
      );
    }

    await labels.getByText('unpkg', { exact: true }).click();
    await expect(code).toContainText('https://unpkg.com/bootstrap@5/');
    await expect(
      page
        .locator('.rp-tabs')
        .nth(1)
        .locator('.rp-tabs__content__item--active code'),
    ).toHaveText(
      '<script src="https://unpkg.com/@scope/package@1/dist/bundle.js"></script>',
    );
    await expect(code.locator('link, script')).toHaveCount(0);

    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
    await tabs
      .locator('.rp-tabs__content__item--active .rp-code-copy-button')
      .click();
    // The native Windows clipboard converts line endings to CRLF.
    await expect
      .poll(async () => {
        const text = await page.evaluate(() => navigator.clipboard.readText());
        return text.replace(/\r\n/g, '\n');
      })
      .toBe(
        '<link rel="stylesheet" href="https://unpkg.com/bootstrap@5/dist/css/bootstrap.min.css" />\n' +
          '<script src="https://unpkg.com/bootstrap@5/dist/js/bootstrap.min.js"></script>',
      );
  });
});
