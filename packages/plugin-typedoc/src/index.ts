import path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
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
      docRoot = config.root;
      const app = await Application.bootstrap(
        {
          name: config.title,
          entryPoints,
          disableSources: true,
          readme: 'none',
          githubPages: false,
          requiredToBeDocumented: ['Class', 'Function', 'Interface'],
        },
        [new TSConfigReader()],
      );
      // Load the markdown plugin manually
      load(app);
      // Set plugin-specific options after loading the plugin
      app.options.setValue('hideBreadcrumbs', true);
      app.options.setValue('fileExtension', '.md');
      app.options.setValue('entryFileName', 'index');
      const project = await app.convert();

      if (project) {
        // 1. Generate doc/api, doc/api/_meta.json by typedoc
        const absoluteApiDir = path.join(docRoot!, outDir);
        // Set the markdown output directory and generate outputs
        app.options.setValue('markdown', absoluteApiDir);
        await app.generateOutputs(project);
        await patchGeneratedApiDocs(absoluteApiDir);
      }
      return config;
    },
  };
}
