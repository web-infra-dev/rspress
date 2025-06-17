import path from 'node:path';
import type { NavItem, RspressPlugin } from '@rspress/shared';
import { Application, TSConfigReader } from 'typedoc';
import { load } from 'typedoc-plugin-markdown';
import { API_DIR } from './constants';
import { patchGeneratedApiDocs } from './patch';

export interface PluginTypeDocOptions {
  /**
   * The entry points of modules.
   * @default []
   */
  entryPoints: string[];
  /**
   * The output directory.
   * @default 'api'
   */
  outDir?: string;
}

export function pluginTypeDoc(options: PluginTypeDocOptions): RspressPlugin {
  let docRoot: string | undefined;
  const { entryPoints = [], outDir = API_DIR } = options;
  const apiPageRoute = `/${outDir.replace(/(^\/)|(\/$)/, '')}/`; // e.g: /api/
  return {
    name: '@rspress/plugin-typedoc',
    async config(config) {
      const app = new Application();
      docRoot = config.root;
      app.options.addReader(new TSConfigReader());
      load(app);
      app.bootstrap({
        name: config.title,
        entryPoints,
        theme: 'markdown',
        disableSources: true,
        readme: 'none',
        githubPages: false,
        requiredToBeDocumented: ['Class', 'Function', 'Interface'],
        plugin: ['typedoc-plugin-markdown'],
        // @ts-expect-error - FIXME: current version of MarkdownTheme has no export, bump related package versions
        hideBreadcrumbs: true,
        hideMembersSymbol: true,
        allReflectionsHaveOwnDocument: true,
      });
      const project = app.convert();

      if (project) {
        // 1. Generate doc/api, doc/api/_meta.json by typedoc
        const absoluteApiDir = path.join(docRoot!, outDir);
        await app.generateDocs(project, absoluteApiDir);
        await patchGeneratedApiDocs(absoluteApiDir);

        // 2. Generate "api" nav bar
        config.themeConfig = config.themeConfig || {};
        config.themeConfig.nav = config.themeConfig.nav || [];
        const { nav } = config.themeConfig;

        // avoid that user config "api" in doc/_meta.json
        function isApiAlreadyInNav(navList: NavItem[]) {
          return navList.some(item => {
            if (
              'link' in item &&
              typeof item.link === 'string' &&
              item.link.startsWith(
                apiPageRoute.slice(0, apiPageRoute.length - 1), // /api
              )
            ) {
              return true;
            }
            return false;
          });
        }

        // Note: TypeDoc does not support i18n
        if (Array.isArray(nav)) {
          if (!isApiAlreadyInNav(nav)) {
            nav.push({
              text: 'API',
              link: apiPageRoute,
            });
          }
        } else if ('default' in nav) {
          if (!isApiAlreadyInNav(nav.default)) {
            nav.default.push({
              text: 'API',
              link: apiPageRoute,
            });
          }
        }
      }
      return config;
    },
  };
}
