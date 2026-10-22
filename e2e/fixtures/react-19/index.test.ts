import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

function getPackageVersion(name: string) {
  const pkgJsonPath = path.join(
    import.meta.dirname,
    'node_modules',
    name,
    'package.json',
  );
  return JSON.parse(readFileSync(pkgJsonPath, 'utf-8')).version as string;
}

test.describe('React 19', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('renders the installed React and router versions', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const body = page.locator('body');
    await expect(body).toContainText(
      `react-router-dom ${getPackageVersion('react-router-dom')}`,
    );
    await expect(body).toContainText(`react ${getPackageVersion('react')}`);
  });
});
