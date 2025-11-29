import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import { Application } from 'typedoc';
import { load as loadPluginMarkdown } from 'typedoc-plugin-markdown';
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
  const { entryPoints = [], outDir = API_DIR } = options;
  return {
    name: '@rspress/plugin-typedoc',
    async config(config) {
      const app = await Application.bootstrapWithPlugins({
        name: config.title,
        entryPoints,
        disableSources: true,
        router: 'kind',
        readme: 'none',
        githubPages: false,
        requiredToBeDocumented: ['Class', 'Function', 'Interface'],
        // @ts-expect-error - Typedoc does not export a type for this options
        plugin: [loadPluginMarkdown],
        entryFileName: 'index',
        hidePageHeader: true,
        hideBreadcrumbs: true,
        pageTitleTemplates: {
          module: '{kind}: {name}', // e.g. "Module: MyModule"
        },
      });

      const project = await app.convert();
      if (project) {
        // 1. Generate doc/api, doc/api/_meta.json by typedoc
        const absoluteApiDir = path.join(config.root!, outDir);
        await app.outputs.writeOutput(
          { name: 'markdown', path: absoluteApiDir },
          project,
        );
        await patchGeneratedApiDocs(absoluteApiDir);
      }
      return config;
    },
  };
}
