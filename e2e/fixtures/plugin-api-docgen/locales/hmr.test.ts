import { spawn, type ChildProcess } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { expect, test, type Page } from '@e2e/test';
import treeKill from 'tree-kill';
import { getPort } from '../../../utils/runCommands';

const HMR_TIMEOUT = 30_000;
const ACTION_TIMEOUT = 10_000;

test.describe('API docgen translation updates', () => {
  let appDir: string;
  let app: ChildProcess | undefined;
  let appPort: number;
  let output: string;
  let processError: Error | undefined;
  let isClosed: boolean;

  const buildCount = () => output.match(/built in/g)?.length ?? 0;

  async function waitForBuild(previousCount: number) {
    const deadline = performance.now() + HMR_TIMEOUT;
    while (performance.now() < deadline) {
      if (processError) {
        throw processError;
      }
      if (isClosed) {
        throw new Error(`Dev server exited before compiling:\n${output}`);
      }
      if (buildCount() > previousCount) {
        return;
      }
      await sleep(100);
    }
    throw new Error(
      `Dev server did not compile within ${HMR_TIMEOUT}ms:\n${output}`,
    );
  }

  async function openPage(page: Page) {
    // Subscribe before navigating so the first HMR handshake cannot be missed.
    const connected = page
      .waitForEvent('websocket', {
        timeout: ACTION_TIMEOUT,
      })
      .then(socket =>
        socket.waitForEvent('framereceived', {
          predicate: frame => JSON.parse(String(frame.payload)).type === 'ok',
          timeout: ACTION_TIMEOUT,
        }),
      );
    await Promise.all([
      connected,
      page.goto(`http://localhost:${appPort}/zh/`, {
        waitUntil: 'domcontentloaded',
        timeout: ACTION_TIMEOUT,
      }),
    ]);
  }

  async function waitForHeaders(
    page: Page,
    property: string,
    description: string,
  ) {
    // Keep polling inside the browser with a hard timeout. No navigation or
    // unbounded locator.textContent() calls inside expect.poll callbacks.
    await page
      .waitForFunction(
        expected => {
          const headers = document.querySelectorAll<HTMLElement>(
            '.rspress-plugin-api-docgen th',
          );
          return (
            headers[0]?.textContent === expected.property &&
            headers[1]?.textContent === expected.description
          );
        },
        { property, description },
        { timeout: HMR_TIMEOUT },
      )
      .catch(cause => {
        throw new Error(
          `Expected API headers ${JSON.stringify({ property, description })}:\n${output}`,
          { cause },
        );
      });
  }

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(ACTION_TIMEOUT);
    page.setDefaultNavigationTimeout(ACTION_TIMEOUT);
    output = '';
    processError = undefined;
    isClosed = false;
    app = undefined;
    // Each attempt owns its sources and generated files. The checked-in fixture
    // stays available to the locale and SSR tests, even when these files run in parallel.
    appDir = await mkdtemp(path.join(import.meta.dirname, '.hmr-'));
    for (const name of ['doc', 'src', 'i18n.json', 'rspress.config.ts']) {
      await cp(path.join(import.meta.dirname, name), path.join(appDir, name), {
        recursive: true,
      });
    }
    appPort = await getPort();
    app = spawn(
      process.execPath,
      [
        path.resolve(
          import.meta.dirname,
          '../../../../packages/core/bin/rspress.js',
        ),
        'dev',
        '--port',
        String(appPort),
      ],
      {
        cwd: appDir,
        env: {
          ...process.env,
          RSPRESS_PERSISTENT_CACHE: 'false',
          RSPRESS_LAZY_COMPILATION: 'false',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const collectOutput = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-16_000);
    };
    app.stdout!.on('data', collectOutput);
    app.stderr!.on('data', collectOutput);
    app.on('error', error => {
      processError = error;
    });
    app.on('close', () => {
      isClosed = true;
    });
    await waitForBuild(0);
  });

  test.afterEach(async () => {
    try {
      if (app?.pid && !isClosed) {
        // A config restart may be stuck in graceful shutdown. Kill the whole
        // process tree, then wait for close before removing the owned directory.
        const pid = app.pid;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () =>
              reject(
                new Error(
                  `Dev server did not exit within ${ACTION_TIMEOUT}ms:\n${output}`,
                ),
              ),
            ACTION_TIMEOUT,
          );
          app!.once('close', () => {
            clearTimeout(timer);
            resolve();
          });
          treeKill(pid, 'SIGKILL', error => {
            if (error) {
              clearTimeout(timer);
              reject(error);
            }
          });
        });
      }
    } finally {
      if (appDir) {
        await rm(appDir, { recursive: true, force: true });
      }
    }
  });

  test(
    'updates i18n.json repeatedly without reloading the page',
    { timeout: 120_000 },
    async ({ page }) => {
      await openPage(page);
      await waitForHeaders(page, '组件属性 | 名称\n字段', '参数说明');
      await page.evaluate(() => {
        (window as Window & { __i18nHmrMarker?: string }).__i18nHmrMarker =
          'preserved';
      });
      const sourcePath = path.join(appDir, 'i18n.json');
      const source = JSON.parse(await readFile(sourcePath, 'utf-8'));
      for (const description of ['First JSON update', 'Second JSON update']) {
        source.apiDocgenDescription.zh = description;
        await writeFile(sourcePath, JSON.stringify(source));
        await waitForHeaders(page, '组件属性 | 名称\n字段', description);
        expect(
          await page.evaluate(
            () =>
              (window as Window & { __i18nHmrMarker?: string }).__i18nHmrMarker,
          ),
        ).toBe('preserved');
      }
      expect(output).not.toContain('restarting server');
    },
  );

  test(
    'reloads config translations after the dev server restarts',
    { timeout: 120_000 },
    async ({ page }) => {
      await openPage(page);
      await waitForHeaders(page, '组件属性 | 名称\n字段', '参数说明');
      const configPath = path.join(appDir, 'rspress.config.ts');
      const config = await readFile(configPath, 'utf-8');
      const updatedConfig = config.replace(
        '组件属性 | 名称\\n字段',
        'Updated config property',
      );
      expect(updatedConfig).not.toBe(config);
      const previousCount = buildCount();
      await writeFile(configPath, updatedConfig);
      await waitForBuild(previousCount);
      expect(output).toContain('restarting server');
      // Navigate once, after the replacement server has compiled.
      await openPage(page);
      await waitForHeaders(page, 'Updated config property', '参数说明');
    },
  );
});
