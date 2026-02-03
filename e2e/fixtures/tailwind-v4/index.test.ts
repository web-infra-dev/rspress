import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tailwind-v4', async () => {
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

  test('tailwind utility classes should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const redText = page.locator('.text-red-500');
    await expect(redText).toHaveCSS(
      'color',
      /rgb\(239,\s*68,\s*68\)|lab\(55\.4814\s/,
    );

    const boldText = page.locator('.font-bold');
    await expect(boldText).toHaveCSS('font-weight', '700');

    const blueBox = page.getByText('Blue Box');
    await expect(blueBox).toHaveCSS('padding', '16px');
  });

  test('shadcn/ui button should render with correct styles', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const defaultButton = page.getByTestId('shadcn-button');
    await expect(defaultButton).toBeVisible();
    await expect(defaultButton).toHaveCSS('display', 'inline-flex');
    await expect(defaultButton).toHaveCSS('border-radius', '6px');
    await expect(defaultButton).toHaveCSS('height', '40px');

    const outlineButton = page.getByTestId('shadcn-button-outline');
    await expect(outlineButton).toBeVisible();
    await expect(outlineButton).toHaveCSS(
      'background-color',
      /rgba?\(0,\s*0,\s*0,\s*0\)|transparent/,
    );
  });

  test('dark mode classes should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const darkModeTest = page.getByTestId('dark-mode-test');

    // Light mode: text should be black, bg should be white
    await expect(darkModeTest).toHaveCSS('color', /rgb\(0,\s*0,\s*0\)/);
    await expect(darkModeTest).toHaveCSS(
      'background-color',
      /rgb\(255,\s*255,\s*255\)/,
    );

    // Toggle dark mode by adding .dark class to html
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Dark mode: text should be white, bg should be black
    await expect(darkModeTest).toHaveCSS('color', /rgb\(255,\s*255,\s*255\)/);
    await expect(darkModeTest).toHaveCSS(
      'background-color',
      /rgb\(0,\s*0,\s*0\)/,
    );
  });
});
