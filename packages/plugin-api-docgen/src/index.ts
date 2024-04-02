import path from 'path';
import type { RspressPlugin } from '@rspress/shared';
import fs from '@modern-js/utils/fs-extra';
import type {
  PluginOptions,
  SupportLanguages,
  ExtendedPageData,
} from './types';
import { docgen } from './docgen';
import { apiDocMap } from './constants';

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
      config.markdown.mdxRs = false;
      return config;
    },
    async beforeBuild(config, isProd) {
      // only support zh and en
      const languages = (
        config.themeConfig?.locales?.map(locale => locale.lang) ||
        config.locales?.map(locale => locale.lang) || [config.lang]
      ).filter(lang => lang === 'zh' || lang === 'en') as SupportLanguages[];
      await docgen({
        entries,
        apiParseTool,
        languages,
        appDir,
        parseToolOptions,
        isProd,
      });
    },
    async modifySearchIndexData(pages) {
      // Update the search index of module doc which includes `<API moduleName="foo" />` and `<API moduleName="foo" ></API>
      const apiCompRegExp = /(<API\s+moduleName=['"](\S+)['"]\s*(.*)?\/>)|(<API\s+moduleName=['"](\S+)['"]\s*(.*)?>(.*)?<\/API>)/;
      await Promise.all(
        pages.map(async page => {
          const { _filepath, lang } = page;
          let content = await fs.readFile(_filepath, 'utf-8');
          let matchResult = new RegExp(apiCompRegExp).exec(content);
          if (!matchResult) {
            return;
          }
          while (matchResult !== null) {
            const [matchContent, moduleName] = matchResult;
            const apiDoc =
              apiDocMap[moduleName] || apiDocMap[`${moduleName}-${lang}`];
            content = content.replace(matchContent, apiDoc);
            matchResult = new RegExp(apiCompRegExp).exec(content);
          }
          page.content = content;
        }),
      );
    },
    extendPageData(pageData) {
      (pageData as ExtendedPageData).apiDocMap = { ...apiDocMap };
    },
    markdown: {
      globalComponents: [
        path.join(__dirname, '..', 'static', 'global-components', 'API.tsx'),
      ],
    },
  };
}

export type { PluginOptions };
