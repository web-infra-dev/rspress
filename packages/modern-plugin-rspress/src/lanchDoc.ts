import { join, relative, resolve } from 'node:path';
import { fs, fastGlob } from '@modern-js/utils';
import { pluginPreview } from '@rspress/plugin-preview';
import type { UserConfig, Sidebar, SidebarGroup } from '@rspress/core';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';
import { mergeModuleDocConfig } from './utils';
import type { PluginOptions } from './types';

export async function launchDoc({
  appDir,
  isProduction,
  pluginOptions,
}: {
  appDir: string;
  isProduction: boolean;
  pluginOptions?: PluginOptions;
}) {
  const {
    doc = {},
    iframeOptions,
    iframePosition,
    defaultRenderMode,
    entries,
    apiParseTool,
    parseToolOptions,
  } = pluginOptions || {};
  // TODO: remove
  let previewMode = pluginOptions?.previewMode;
  if (previewMode === 'web') {
    previewMode = 'internal';
  }
  if (previewMode === 'mobile') {
    previewMode = 'iframe';
  }
  const json = JSON.parse(
    fs.readFileSync(resolve(appDir, './package.json'), 'utf8'),
  );
  const root = resolve(appDir, doc.root ?? 'docs');
  const { dev, build } = await import('@rspress/core');

  const languages = doc.themeConfig?.locales?.map(locale => locale.lang) ||
    doc.locales?.map(locale => locale.lang) || [''];

  const defaultLanguage = doc.lang || '';

  const sidebar: Sidebar = {};

  let haveMetaJson = false;

  const getAutoSidebarGroup = async (
    lang: string,
    prefix: string,
  ): Promise<SidebarGroup> => {
    const base = join(root, lang);
    const source = ['*.(js|jsx|ts|tsx|md|mdx|json)'];
    const traverse = async (cwd: string): Promise<SidebarGroup['items']> => {
      // FIXME: win32
      const [files, directories] = await Promise.all([
        fastGlob(source, {
          cwd,
          onlyFiles: true,
          ignore: ['index.*'],
        }),
        fastGlob(['*'], {
          cwd,
          onlyDirectories: true,
          ignore: ['public'],
        }),
      ]);

      // files --> string[]
      if (files.filter(file => file === '_meta.json').length > 0) {
        haveMetaJson = true;
        return [];
      }
      const fileItems = files.map(file => {
        const link = `/${relative(base, join(cwd, file)).replace(
          /\.[^.]+$/,
          '',
        )}`;
        return prefix + link;
      });

      // dir --> SidebarGroup[]
      const directoryItems = await Promise.all(
        directories.map(async (directory: string) => {
          const directoryCwd = join(cwd, directory);
          const hasIndex =
            (
              await fastGlob(['index.*'], {
                cwd: directoryCwd,
                onlyFiles: true,
              })
            ).length > 0;
          const link = `${prefix}/${relative(base, directoryCwd)}/`;
          const items = await traverse(directoryCwd);
          const text = directory[0].toUpperCase() + directory.slice(1);
          if (hasIndex) {
            return {
              link,
              collapsible: items.length > 0,
              items,
              text,
            };
          }
          return {
            collapsible: items.length > 0,
            items,
            text,
          };
        }),
      );

      return [...fileItems, ...directoryItems];
    };

    return {
      text: 'Module List',
      link: `${prefix}/`,
      collapsible: false,
      items: await traverse(base),
    };
  };

  await Promise.all(
    languages.map(async lang => {
      const havePrefix = lang && lang !== defaultLanguage;
      const prefix = havePrefix ? `/${lang}` : '';
      const sidebarGroup = await getAutoSidebarGroup(lang, prefix);
      sidebar[`${prefix}/`] = [sidebarGroup];
    }),
  );

  const modernDocConfig = mergeModuleDocConfig<UserConfig>(
    {
      root,
      title: json.name,
      globalStyles: join(
        __dirname,
        '..',
        'static',
        'global-styles',
        'index.css',
      ),
      themeConfig: {
        darkMode: false,
        sidebar: !haveMetaJson ? sidebar : undefined,
      },
      markdown: {
        mdxRs: false,
        globalComponents: [
          join(__dirname, '..', 'static', 'global-components', 'Overview.tsx'),
        ],
      },
      builderConfig: {
        source: {
          alias: {
            'rspress/runtime': '@rspress/core/runtime',
            'rspress/theme': '@rspress/core/theme',
            '@rspress/core': join(
              require.resolve('@rspress/core/package.json'),
              '..',
            ),
          },
        },
      },
      head: [
        `
          <script>
            window.MODERN_THEME = 'light';
          </script>
          `,
      ],
      plugins: [
        pluginPreview({
          previewMode,
          iframePosition,
          iframeOptions,
          defaultRenderMode,
        }),
        pluginApiDocgen({
          entries,
          apiParseTool,
          appDir,
          parseToolOptions,
        }),
      ],
    },
    {
      ...doc,
      base: isProduction ? doc.base : '',
    },
  );

  if (isProduction) {
    await build({
      appDirectory: appDir,
      docDirectory: root,
      config: modernDocConfig,
    });
  } else {
    await dev({
      appDirectory: appDir,
      docDirectory: root,
      config: modernDocConfig,
    });
  }
}
