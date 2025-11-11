import fs from 'node:fs';
import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import { logger } from '@rspress/core';
import { apiDocMap } from './constants';
import { docgen } from './docgen';
import type { PluginOptions, SupportLanguages } from './types';

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
  return {
    name: '@modern-js/doc-plugin-api-docgen',
    config(config) {
      config.markdown = config.markdown || {};
      return config;
    },
    async beforeBuild(config, isProd) {
      // only support zh , en and ru
      let languages: SupportLanguages[] = (
        config.themeConfig?.locales?.map(locale => locale.lang) ||
        config.locales?.map(locale => locale.lang) ||
        []
      ).filter((lang): lang is SupportLanguages =>
        ['zh', 'en', 'ru'].includes(lang),
      ) as SupportLanguages[];

      const defaultLang = config.lang || 'en';
      if (languages.length === 0) {
        languages = [defaultLang as SupportLanguages];
      }

      await docgen({
        entries,
        apiParseTool,
        languages,
        appDir,
        parseToolOptions,
        isProd,
      });
      config.builderConfig = config.builderConfig || {};
      config.builderConfig.source = config.builderConfig.source || {};
      config.builderConfig.source.define = {
        ...config.builderConfig.source.define,
        RSPRESS_PLUGIN_API_DOCGEN_MAP: JSON.stringify(apiDocMap),
      };
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
        path.join(__dirname, '..', 'static', 'global-components', 'API.tsx'),
      ],
    },
  };
}

export type { PluginOptions };
