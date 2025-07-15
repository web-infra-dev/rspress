import path from 'node:path';
import type { RspressPlugin } from 'rspress/core';
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
      }
      return config;
    },
  };
}
