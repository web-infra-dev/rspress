import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

for (const mode of ['dev', 'build'] as const) {
  for (const themed of [false, true]) {
    test.describe(`file URL logo: ${mode}, themed=${themed}`, () => {
      let app: Awaited<ReturnType<typeof runDevCommand>>;
      let port: number;
      const appDir = import.meta.dirname;
      const configFile = themed ? 'logoThemed.config.ts' : 'logo.config.ts';

      test.beforeAll(async () => {
        port = await getPort();
        if (mode === 'dev') {
          app = await runDevCommand(appDir, port, configFile);
        } else {
          await runBuildCommand(appDir, configFile);
          app = await runPreviewCommand(appDir, port, ['-c', configFile]);
        }
      });

      test.afterAll(async () => {
        if (app) {
          await killProcess(app);
        }
      });

      test('serves local logos under base without exposing file URLs', async ({
        page,
      }) => {
        const response = await page.goto(`http://localhost:${port}/docs/`);
        const html = await response!.text();
        const logos = page.locator('.rspress-logo');
        await expect(logos).toHaveCount(themed ? 2 : 1);

        const sources: string[] = [];
        for (const [index, theme] of (themed
          ? ['light', 'dark']
          : ['light']
        ).entries()) {
          const logo = logos.nth(index);
          await expect(logo).toHaveAttribute('src', /^\/docs\/static\//);
          const source = (await logo.getAttribute('src'))!;
          sources.push(source);
          const asset = await page.request.get(
            `http://localhost:${port}${source}`,
          );
          expect(asset.ok()).toBe(true);
          expect(await asset.text()).toBe(
            await readFile(
              path.join(appDir, 'assets', theme, 'logo #1.svg'),
              'utf8',
            ),
          );
          await expect
            .poll(() =>
              logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
            )
            .toBe(32);
          if (mode === 'build') {
            expect(html).toContain(source);
          }
        }
        expect(new Set(sources).size).toBe(sources.length);
        expect(html).not.toContain('file://');
      });
    });
  }
}
