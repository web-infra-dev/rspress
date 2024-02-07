import type {
  UserConfig,
  PageIndexInfo,
  RspressPlugin,
  RouteMeta,
} from '@rspress/shared';
import { isDebugMode } from '@rspress/shared';
import { pluginContainerSyntax } from '@rspress/plugin-container-syntax';

export class PluginDriver {
  #config: UserConfig;

  #plugins: RspressPlugin[];

  #isProd: boolean;

  constructor(config: UserConfig, isProd: boolean) {
    this.#config = config;
    this.#isProd = isProd;
    this.#plugins = [];
  }

  // The init function is used to initialize the doc plugins and will execute before the build process.
  async init() {
    // Clear RspressPlugins first, for the watch mode
    this.clearPlugins();
    const config = this.#config;
    const themeConfig = config?.themeConfig || {};
    const enableLastUpdated =
      themeConfig?.lastUpdated ||
      themeConfig?.locales?.some(locale => locale.lastUpdated);
    const mediumZoomConfig = config?.mediumZoom ?? true;
    const haveNavSidebarConfig =
      themeConfig.nav ||
      themeConfig.sidebar ||
      themeConfig.locales?.[0].nav ||
      themeConfig.locales?.[0].sidebar;
    if (enableLastUpdated) {
      const { pluginLastUpdated } = await import(
        '@rspress/plugin-last-updated'
      );
      this.addPlugin(pluginLastUpdated());
    }
    if (mediumZoomConfig) {
      const { pluginMediumZoom } = await import('@rspress/plugin-medium-zoom');
      this.addPlugin(
        pluginMediumZoom(
          typeof mediumZoomConfig === 'object' ? mediumZoomConfig : undefined,
        ),
      );
    }
    if (!haveNavSidebarConfig) {
      const { pluginAutoNavSidebar } = await import(
        '@rspress/plugin-auto-nav-sidebar'
      );
      this.addPlugin(pluginAutoNavSidebar());
    }

    // Support the container syntax in markdown/mdx, such as :::tip
    this.addPlugin(pluginContainerSyntax());

    if (isDebugMode()) {
      const SourceBuildPlugin = await import(
        // @ts-expect-error need moduleResolution: Node16, NodeNext or Bundler to get type declerations work
        '@rspress/theme-default/node/source-build-plugin.js'
      ).then(
        r => r.SourceBuildPlugin,
        () => null as never,
      );

      if (SourceBuildPlugin) {
        this.addPlugin(SourceBuildPlugin());
      }
    }

    (config.plugins || []).forEach(plugin => {
      this.addPlugin(plugin);
    });
  }

  addPlugin(plugin: RspressPlugin) {
    const exsitedIndex = this.#plugins.findIndex(
      item => item.name === plugin.name,
    );
    // Avoid the duplicated plugin
    if (exsitedIndex !== -1) {
      throw new Error(`The plugin "${plugin.name}" has been registered`);
    } else {
      this.#plugins.push(plugin);
    }
  }

  getPlugins() {
    return this.#plugins;
  }

  clearPlugins() {
    this.#plugins = [];
  }

  removePlugin(pluginName: string) {
    const index = this.#plugins.findIndex(item => item.name === pluginName);
    if (index !== -1) {
      this.#plugins.splice(index, 1);
    }
  }

  async modifyConfig() {
    let config = this.#config;

    for (const plugin of this.#plugins) {
      if (typeof plugin.config === 'function') {
        config = await plugin.config(
          config || {},
          {
            addPlugin: this.addPlugin.bind(this),
            removePlugin: this.removePlugin.bind(this),
          },
          this.#isProd,
        );
      }
    }
    this.#config = config;
    return this.#config;
  }

  async beforeBuild() {
    return this._runParallelAsyncHook(
      'beforeBuild',
      this.#config || {},
      this.#isProd,
    );
  }

  async afterBuild() {
    return this._runParallelAsyncHook(
      'afterBuild',
      this.#config || {},
      this.#isProd,
    );
  }

  async modifySearchIndexData(
    pages: PageIndexInfo[],
  ): Promise<PageIndexInfo[]> {
    return this._runParallelAsyncHook(
      'modifySearchIndexData',
      pages,
      this.#isProd,
    );
  }

  async extendPageData(pageData: PageIndexInfo) {
    return this._runParallelAsyncHook('extendPageData', pageData, this.#isProd);
  }

  async addPages() {
    // addPages hooks
    const result = await this._runParallelAsyncHook(
      'addPages',
      this.#config || {},
      this.#isProd,
    );
    return result.flat();
  }

  async routeGenerated(routes: RouteMeta[]) {
    return this._runParallelAsyncHook('routeGenerated', routes);
  }

  async addRuntimeModules() {
    const result: Record<string, string>[] = await this._runParallelAsyncHook(
      'addRuntimeModules',
      this.#config || {},
      this.#isProd,
    );

    return result.reduce((prev, current) => {
      return {
        ...prev,
        ...current,
      };
    }, {});
  }

  async addSSGRoutes() {
    const result = await this._runParallelAsyncHook(
      'addSSGRoutes',
      this.#config || {},
      this.#isProd,
    );

    return result.flat();
  }

  globalUIComponents(): (string | [string, object])[] {
    const result = this.#plugins.map(plugin => {
      return plugin.globalUIComponents || [];
    });

    return result.flat();
  }

  globalStyles(): string[] {
    return this.#plugins
      .filter(plugin => typeof plugin.globalStyles === 'string')
      .map(plugin => {
        return plugin.globalStyles;
      });
  }

  _runParallelAsyncHook(hookName: string, ...args: unknown[]) {
    return Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin[hookName] === 'function')
        .map(plugin => {
          return plugin[hookName](...args);
        }),
    );
  }

  _runSerialAysncHook(hookName: string, ...args: unknown[]) {
    return this.#plugins.reduce(async (prev, plugin) => {
      if (typeof plugin[hookName] === 'function') {
        await prev;
        return plugin[hookName](...args);
      }
      return prev;
    }, Promise.resolve());
  }
}
