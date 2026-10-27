import fs from 'node:fs';
import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import { logger } from '@rspress/core';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import { apiDocgenI18n } from '../static/i18n';
import { apiDocMap, PACKAGE_ROOT } from './constants';
import { docgen } from './docgen';
import type { PluginOptions } from './types';

const VIRTUAL_MODULE_NAME = 'rspress-plugin-api-docgen-map';
type ConfigUtils = Parameters<NonNullable<RspressPlugin['config']>>[1];

/**
 * The plugin is used to generate api doc for files.
 */
export function pluginApiDocgen(options?: PluginOptions): RspressPlugin {
  const {
    entries = {},
    apiParseTool = 'react-docgen-typescript',
    appDir = process.cwd(),
    parseToolOptions = {},
  } = options || {};
  let getI18nData: ConfigUtils['getI18nData'];
  return {
    name: '@rspress/plugin-api-docgen',
    i18nSource(source) {
      return {
        ...source,
        ...structuredClone(apiDocgenI18n),
      };
    },
    config(config, utils) {
      getI18nData = utils.getI18nData;
      config.markdown = config.markdown || {};
      return config;
    },
    async beforeBuild(config) {
      const i18nSource = await getI18nData();
      const docgenOptions = {
        entries,
        apiParseTool,
        languages: Object.keys(i18nSource.apiDocgenProperty),
        i18nSource,
        appDir,
        parseToolOptions,
      };
      // Initial generation so that modifySearchIndexData has data
      const sourceFiles = await docgen(docgenOptions);
      let isFirstTransform = true;

      config.builderConfig = config.builderConfig || {};
      config.builderConfig.plugins = [
        ...(config.builderConfig.plugins || []),
        pluginVirtualModule({
          virtualModules: {
            [VIRTUAL_MODULE_NAME]: async context => {
              docgenOptions.i18nSource = await getI18nData(context);
              if (isFirstTransform) {
                isFirstTransform = false;
              } else {
                await docgen(docgenOptions);
              }
              for (const filePath of sourceFiles) {
                context.addDependency(filePath);
              }
              return `export default ${JSON.stringify(apiDocMap)};`;
            },
          },
        }),
      ];
    },
    async modifySearchIndexData(pages) {
      // Update the search index of module doc which includes `<API moduleName="foo" />` and `<API moduleName="foo" ></API>
      const apiCompRegExp =
        /(<API\s+moduleName=['"](\S+)['"]\s*(.*)?\/>)|(<API\s+moduleName=['"](\S+)['"]\s*(.*)?>(.*)?<\/API>)/;
      await Promise.all(
        pages.map(async page => {
          const { _filepath, lang } = page;
          let content = await fs.promises.readFile(_filepath, 'utf-8');
          let matchResult = apiCompRegExp.exec(content);
          if (!matchResult) {
            return;
          }
          while (matchResult !== null) {
            const matchContent = matchResult[0];
            const moduleName = matchResult[2] ?? matchResult[5] ?? '';
            const apiDoc =
              apiDocMap[`${moduleName}-${lang ? lang : 'en'}`] ?? '';
            if (matchContent && !apiDoc) {
              logger.warn(
                `No api doc found for module: ${moduleName} in lang: ${lang ?? 'en'}`,
              );
            }
            content = content.replace(matchContent, apiDoc);
            matchResult = apiCompRegExp.exec(content);
          }
          page.content = content;
        }),
      );
    },
    markdown: {
      globalComponents: [
        path.join(PACKAGE_ROOT, 'static', 'global-components', 'API.tsx'),
      ],
    },
  };
}

export type { PluginOptions };
