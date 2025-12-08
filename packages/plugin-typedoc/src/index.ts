import path from 'node:path';
import { cwd } from 'node:process';
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
  /**
   * A function to setup the TypeDoc Application.
   * @param app
   */
  setup?: (app: Application) => Promise<Application> | Promise<void> | void;
}

export function pluginTypeDoc(options: PluginTypeDocOptions): RspressPlugin {
  const {
    entryPoints: userEntryPoints = [],
    outDir = API_DIR,
    setup = () => {},
  } = options;

  // windows posix path fix https://github.com/web-infra-dev/rspress/pull/2790#issuecomment-3590946652
  const entryPoints = userEntryPoints.map(entryPath => {
    if (!path.isAbsolute(entryPath)) {
      return entryPath;
    }
    // Convert Windows paths to POSIX format before calculating relative path
    // Replace all backslashes with forward slashes
    const cwdPosix = cwd().replace(/\\/g, '/');
    const entryPosix = entryPath.replace(/\\/g, '/');
    return path.posix.relative(cwdPosix, entryPosix);
  });

  return {
    name: '@rspress/plugin-typedoc',
    async config(config) {
      let app = await Application.bootstrapWithPlugins({
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
      app = (await setup(app)) || app;

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
