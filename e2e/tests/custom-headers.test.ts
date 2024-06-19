import { expect, test } from '@playwright/test';
import path from 'node:path';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('custom headers', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'custom-headers');
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should render only one title tag during ssg', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const titleDoms = await page.$$('title');
    expect(titleDoms.length).toBe(1);
  });

  test('config headers should be injected', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const configStringMetaContent = await page.$eval(
      'meta[name="config-string-head"]',
      configStringMeta => configStringMeta.getAttribute('content'),
    );
    expect(configStringMetaContent).toEqual('config-string-head-value');

    const configTupleMetaContent = await page.getAttribute(
      'meta[name="config-tuple-head"]',
      'content',
    );
    expect(configTupleMetaContent).toEqual('config-tuple-head-value');

    const configFnStringMetaContent = await page.$eval(
      'meta[name="config-fn-string-head"]',
      configFnStringMeta => configFnStringMeta.getAttribute('content'),
    );
    expect(
      configFnStringMetaContent?.endsWith(
        'e2e/fixtures/custom-headers/doc/index.mdx',
      ),
    ).toBeTruthy();

    const configFnTupleMetaContent = await page.getAttribute(
      'meta[name="config-fn-tuple-head"]',
      'content',
    );
    expect(
      configFnTupleMetaContent?.endsWith(
        'e2e/fixtures/custom-headers/doc/index.mdx',
      ),
    ).toBeTruthy();
  });

  test('frontmatter headers should be injected', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const customMetaContent = await page.$eval(
      'meta[name="custom-meta"]',
      customMeta => customMeta.getAttribute('content'),
    );
    expect(customMetaContent).toEqual('custom-meta-content');

    const customMetaContent2 = await page.getAttribute(
      'meta[name="custom-meta-2"]',
      'content',
    );
    expect(customMetaContent2).toEqual('custom-meta-content-2');
  });
});
