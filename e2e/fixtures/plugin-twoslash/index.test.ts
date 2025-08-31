import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin twoslash test', async () => {
  let appPort: number;
  let app: unknown;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should render twoslash popup elements', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const triggers = await page.$$('twoslash-popup-trigger');
    expect(triggers.length).toBe(10);

    for (const trigger of triggers) {
      const container = await trigger.$('twoslash-popup-container');
      expect(container).not.toBeNull();

      const initialized = await container?.getAttribute('data-initialized');
      expect(initialized).toBeNull();

      const inner = await container.$('.twoslash-popup-inner');
      expect(inner).not.toBeNull();
      const arrow = await container.$('.twoslash-popup-arrow');
      expect(arrow).not.toBeNull();
    }
  });

  test('should clone twoslash popup elements', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const portal = await page.$('twoslash-popup-portal');
    expect(portal).not.toBeNull();

    const containers = await portal.$$('twoslash-popup-container');
    expect(containers.length).toBe(10);

    const extractTypeAlways = await containers[1].getAttribute('data-always');
    expect(extractTypeAlways).toBe('true');

    const completionsAlways = await containers[4].getAttribute('data-always');
    expect(completionsAlways).toBe('true');

    for (const container of containers) {
      const initialized = await container.getAttribute('data-initialized');
      expect(initialized).not.toBeNull();

      const inner = await container.$('.twoslash-popup-inner');
      expect(inner).not.toBeNull();
      const arrow = await container.$('.twoslash-popup-arrow');
      expect(arrow).not.toBeNull();
    }
  });

  test('should highlight code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = await page.$(
      'h2:has-text("Highlighting") + .language-ts',
    );
    expect(codeBlock).not.toBeNull();

    const highlighted = await codeBlock?.$('.twoslash-highlighted');
    expect(highlighted).not.toBeNull();
  });

  test('should show errors in code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = await page.$('h2:has-text("Error") + .language-ts');
    expect(codeBlock).not.toBeNull();

    const error = await codeBlock?.$('.twoslash-error');
    expect(error).not.toBeNull();

    const errorLine = await codeBlock?.$('.twoslash-error-line');
    expect(errorLine).not.toBeNull();
  });
});
