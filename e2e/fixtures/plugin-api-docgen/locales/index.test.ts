import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
} from '../../../utils/runCommands';
import { searchInPage } from '../../../utils/search';

test.describe('API docgen locales', async () => {
  let appPort: number;
  let app: unknown;

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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.rspress-plugin-api-docgen table');
    const tableH3 = page.locator('#button');
    await expect(tableH3).toBeVisible();

    const table = page.locator('.rspress-plugin-api-docgen table');

    // Property
    await expect(table).toContainText('Property');
    await expect(table).toContainText('disabled');
    await expect(table).toContainText('size');

    // Description
    await expect(table).toContainText('Description');
    await expect(table).toContainText('Whether to disable the button');
    await expect(table).toContainText('- This is extra line a');
    await expect(table).toContainText('- This is extra line b');
    await expect(table).toContainText('Type of Button');

    // Type
    await expect(table).toContainText('Type');
    await expect(table).toContainText('boolean');
    await expect(table).toContainText('"mini" | "small" | "default" | "large"');

    // Default Value
    await expect(table).toContainText('Default Value');
    await expect(table).toContainText('-');
    await expect(table).toContainText("'default'");
    await expect(table).toContainText('Additional css class');
    await expect(table).toContainText('(Required)');
  });

  test('search index should include api-docgen result', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const suggestItems = await searchInPage(page, 'disabled');
    expect(suggestItems.length).toBe(1);
  });

  test('zh/index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/zh/`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.rspress-plugin-api-docgen table');
    const tableH3 = page.locator('#button');
    await expect(tableH3).toBeVisible();

    const table = page.locator('.rspress-plugin-api-docgen table');

    // Config translations override i18n.json and plugin defaults.
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    await expect(table.getByRole('columnheader').first()).toHaveText(
      '组件属性 | 名称\n字段',
    );
    await expect(table).not.toContainText('JSON 属性');
    await expect(table).toContainText('disabled');
    await expect(table).toContainText('size');

    // i18n.json translations override plugin defaults.
    await expect(table.getByRole('columnheader').nth(1)).toHaveText('参数说明');
    await expect(table).toContainText('Whether to disable the button');
    await expect(table).toContainText('- This is extra line a');
    await expect(table).toContainText('- This is extra line b');
    await expect(table).toContainText('Type of Button');

    // Type (Chinese)
    await expect(table).toContainText('类型');
    await expect(table).toContainText('boolean');
    await expect(table).toContainText('"mini" | "small" | "default" | "large"');

    // Default Value (Chinese)
    await expect(table).toContainText('默认值');
    await expect(table).toContainText('-');
    await expect(table).toContainText("'default'");
    await expect(table).toContainText('节点类名');
    await expect(table).toContainText('(必须配置)');
  });

  // cspell:disable
  const translations = [
    {
      lang: 'ja',
      headers: ['プロパティ', '説明', '型', 'デフォルト値'],
      className: '追加の CSS クラス',
      required: '必須',
    },
    {
      lang: 'ko',
      headers: ['속성', '설명', '타입', '기본값'],
      className: '추가 CSS 클래스',
      required: '필수',
    },
    {
      lang: 'ru',
      headers: ['Свойство', 'Описание', 'Тип', 'Значение по умолчанию'],
      className: 'Имя класса узла',
      required: 'Обязательно',
    },
    {
      lang: 'fr',
      headers: ['Property', 'Description', 'Type', 'Default Value'],
      className: 'Additional css class',
      required: 'Required',
    },
    {
      lang: 'ta',
      headers: ['பண்பு', 'விளக்கம்', 'வகை', 'இயல்புநிலை மதிப்பு'],
      className: 'கூடுதல் CSS வகுப்பு',
      required: 'கட்டாயம்',
    },
  ];
  // cspell:enable

  for (const { lang, headers, className, required } of translations) {
    test(`${lang} translations and fallback descriptions`, async ({ page }) => {
      await page.goto(`http://localhost:${appPort}/${lang}/`, {
        waitUntil: 'networkidle',
      });
      const table = page.locator('.rspress-plugin-api-docgen table');
      await expect(table.getByRole('columnheader')).toHaveText(headers);
      await expect(
        table.locator('tr').filter({ hasText: 'className' }),
      ).toContainText(className);
      await expect(
        table.locator('tr').filter({ hasText: 'Accessible label' }),
      ).toContainText(`(${required})`);
    });
  }

  test('reloads translations from i18n.json and config in dev', async ({
    page,
  }) => {
    const sourcePath = path.join(import.meta.dirname, 'i18n.json');
    const configPath = path.join(import.meta.dirname, 'rspress.config.ts');
    const originalSource = await readFile(sourcePath);
    const originalConfig = await readFile(configPath);
    const pageUrl = `http://localhost:${appPort}/zh/`;
    const headers = page
      .locator('.rspress-plugin-api-docgen table')
      .getByRole('columnheader');

    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      await expect(headers.nth(1)).toHaveText('参数说明');
      await page.evaluate(() => {
        (window as Window & { __i18nHmrMarker?: string }).__i18nHmrMarker =
          'preserved';
      });

      const source = JSON.parse(originalSource.toString());
      source.apiDocgenDescription.zh = 'Updated JSON description';
      await writeFile(sourcePath, JSON.stringify(source));
      await expect(headers.nth(1)).toHaveText('Updated JSON description');
      expect(
        await page.evaluate(
          () =>
            (window as Window & { __i18nHmrMarker?: string }).__i18nHmrMarker,
        ),
      ).toBe('preserved');

      const config = originalConfig
        .toString()
        .replace('组件属性 | 名称\\n字段', 'Updated config property');
      expect(config).not.toBe(originalConfig.toString());
      await writeFile(configPath, config);
      await expect
        .poll(
          async () => {
            try {
              await page.goto(pageUrl, { timeout: 10_000 });
              return await headers.first().textContent();
            } catch {
              return null;
            }
          },
          { timeout: 30_000 },
        )
        .toBe('Updated config property');
      await expect(headers.nth(1)).toHaveText('Updated JSON description');
    } finally {
      await writeFile(sourcePath, originalSource);
      await writeFile(configPath, originalConfig);
    }
  });
});

test('API docgen translations are included in SSR and search output', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);
  const distDir = path.join(appDir, 'doc_build');
  const html = await readFile(path.join(distDir, 'zh/index.html'), 'utf-8');
  const table = html.match(
    /<div class="rspress-plugin-api-docgen">[\s\S]*?<\/table>/,
  )?.[0];

  expect(table).toBeDefined();
  expect(table).toContain('组件属性');
  expect(table).toContain('参数说明');
  expect(table).toContain('必须配置');
  expect(table).toContain('节点类名');
  expect(table).not.toContain('JSON 属性');
  expect(table).not.toMatch(/<th\b[^>]*>undefined<\/th>/);

  const staticDir = path.join(distDir, 'static');
  const files = await readdir(staticDir, { recursive: true });
  const indexFile = files.find(
    file => file.startsWith('search_index.zh.') && file.endsWith('.json'),
  );
  expect(indexFile).toBeDefined();
  const pages: { content: string }[] = JSON.parse(
    await readFile(path.join(staticDir, indexFile!), 'utf-8'),
  );
  const apiContent = pages.find(page =>
    page.content.includes('className'),
  )?.content;

  expect(apiContent).toContain('组件属性');
  expect(apiContent).toContain('参数说明');
  expect(apiContent).toContain('必须配置');
  expect(apiContent).toContain('节点类名');
  expect(apiContent).not.toContain('JSON 属性');
  expect(apiContent).not.toContain('|undefined|');

  // cspell:disable
  const tamilHtml = await readFile(
    path.join(distDir, 'ta/index.html'),
    'utf-8',
  );
  const tamilTable = tamilHtml.match(
    /<div class="rspress-plugin-api-docgen">[\s\S]*?<\/table>/,
  )?.[0];
  expect(tamilTable).toBeDefined();
  expect(tamilTable).toContain('பண்பு');
  expect(tamilTable).toContain('கட்டாயம்');
  expect(tamilTable).not.toMatch(/<th\b[^>]*>undefined<\/th>/);
  expect(tamilHtml).toContain('தேடுக');
  // cspell:enable
});
