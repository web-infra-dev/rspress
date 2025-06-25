import fs from 'node:fs/promises';
import path from 'node:path';
import type { PageModule, RouteMeta, UserConfig } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import type { ComponentType } from 'react';
import { glob } from 'tinyglobby';
import type { PluginDriver } from '../PluginDriver';
import { PUBLIC_DIR } from '../constants';
import { getPageKey, normalizePath } from '../utils';
import { RoutePage } from './RoutePage';
import { getRoutePathParts, normalizeRoutePath } from './normalizeRoutePath';

interface InitOptions {
  scanDir: string;
  config: UserConfig;
  runtimeTempDir: string;
  pluginDriver: PluginDriver;
}

export interface Route {
  path: string;
  element: React.ReactElement;
  filePath: string;
  preload: () => Promise<PageModule<ComponentType<unknown>>>;
  lang: string;
}

export interface RouteOptions {
  extensions?: string[];
  include?: string[];
  exclude?: string[];
}

export class RouteService {
  routeData = new Map<string, RoutePage>();

  #scanDir: string;

  #defaultLang: string;

  #defaultVersion: string = '';

  #extensions: string[] = [];

  #langs: string[] = [];

  #versions: string[] = [];

  #include: string[] = [];

  #exclude: string[] = [];

  #tempDir: string = '';

  #pluginDriver: PluginDriver;

  static __instance__: RouteService | null = null;

  static getInstance(): RouteService {
    return RouteService.__instance__!;
  }

  // The factory to create route service instance
  static async create(options: InitOptions) {
    const { scanDir, config, runtimeTempDir, pluginDriver } = options;
    const routeService = new RouteService(
      scanDir,
      config,
      runtimeTempDir,
      pluginDriver,
    );
    await routeService.#init();
    await pluginDriver.routeServiceGenerated(routeService);
    RouteService.__instance__ = routeService;
    return routeService;
  }

  constructor(
    scanDir: string,
    userConfig: UserConfig,
    tempDir: string,
    pluginDriver: PluginDriver,
  ) {
    const routeOptions = userConfig?.route || {};
    this.#scanDir = scanDir;
    this.#extensions = routeOptions.extensions || DEFAULT_PAGE_EXTENSIONS;
    this.#include = routeOptions.include || [];
    this.#exclude = routeOptions.exclude || [];
    this.#defaultLang = userConfig?.lang || '';
    this.#langs = (
      userConfig?.locales ??
      userConfig?.themeConfig?.locales ??
      []
    ).map(item => item.lang);
    this.#tempDir = tempDir;
    this.#pluginDriver = pluginDriver;

    if (userConfig.multiVersion) {
      this.#defaultVersion = userConfig.multiVersion.default || '';
      this.#versions = userConfig.multiVersion.versions || [];
    }
  }

  get extensions(): readonly string[] {
    return this.#extensions;
  }

  async #init() {
    // 1. internal pages
    const extensions = this.#extensions.map(i => {
      // .mdx -> mdx, .tsx -> tsx
      return i.slice(1);
    });
    const files = (
      await glob([`**/*.{${extensions.join(',')}}`, ...this.#include], {
        cwd: this.#scanDir,
        absolute: true,
        onlyFiles: true,
        ignore: [
          ...this.#exclude,
          '**/node_modules/**',
          '**/.eslintrc.js',
          '**/.nx/**',
          `./${PUBLIC_DIR}/**`,
        ],
      })
    ).sort();

    files.forEach(filePath => {
      const fileRelativePath = normalizePath(
        path.relative(this.#scanDir, filePath),
      );
      const { routePath, lang, version } =
        this.normalizeRoutePath(fileRelativePath);
      const absolutePath = path.join(this.#scanDir, fileRelativePath);

      const routeMeta = {
        routePath,
        absolutePath: normalizePath(absolutePath),
        relativePath: fileRelativePath,
        pageName: getPageKey(fileRelativePath),
        lang,
        version,
      };
      this.addRoute(routeMeta);
    });
    // 2. external pages added by plugins
    const externalPages = await this.#pluginDriver.addPages();

    await Promise.all(
      externalPages.map(async (route, index) => {
        const { routePath, content, filepath } = route;
        // case1: specify the filepath
        if (filepath) {
          const routeMeta = this.#generateRouteMeta(routePath, filepath);
          this.addRoute(routeMeta);
          return;
        }
        // case2: specify the content
        if (content) {
          const filepath = await this.#writeTempFile(index, content);
          const routeMeta = this.#generateRouteMeta(routePath, filepath);
          this.addRoute(routeMeta);
        }
      }),
    );

    await this.#pluginDriver.routeGenerated(this.getRoutes());
  }

  async addRoute(routeMeta: RouteMeta) {
    const { routePath } = routeMeta;
    if (this.routeData.has(routePath)) {
      throw new Error(`routePath ${routePath} has already been added`);
    }

    const routePage = RoutePage.create(routeMeta);
    this.routeData.set(routePath, routePage);
  }

  removeRoute(filePath: string): void {
    const fileRelativePath = path.relative(this.#scanDir, filePath);
    const { routePath } = this.normalizeRoutePath(fileRelativePath);
    this.routeData.delete(routePath);
  }

  getRoutes(): RouteMeta[] {
    return Array.from(this.routeData.values()).map(i => i.routeMeta);
  }

  getRoutePages(): RoutePage[] {
    return Array.from(this.routeData.values());
  }

  isExistRoute(routePath: string): boolean {
    const { routePath: normalizedRoute } = this.normalizeRoutePath(routePath);
    return Boolean(this.routeData.get(normalizedRoute));
  }

  generateRoutesCode(): string {
    return this.generateRoutesCodeByRouteMeta(this.getRoutes());
  }

  generateRoutesCodeByRouteMeta(routeMeta: RouteMeta[]) {
    return `
import React from 'react';
import { lazyWithPreload } from "react-lazy-with-preload";
${routeMeta
  .map((route, index) => {
    return `const Route${index} = lazyWithPreload(() => import('${route.absolutePath}'))`;
  })
  .join('\n')}
export const routes = [
${routeMeta
  .map((route, index) => {
    const preload = `async () => {
        await Route${index}.preload();
        return import("${route.absolutePath}");
      }`;
    const component = `Route${index}`;
    /**
     * {
     *   route: '/',
     *   element: jsx(Route0),
     *   preload: Route0.preload,
     *   filePath: '/Users/foo/bar/index.md'
     * }
     */
    return `{ path: '${route.routePath}', element: React.createElement(${component}), filePath: '${route.relativePath}', preload: ${preload}, lang: '${route.lang}', version: '${route.version}' }`;
  })
  .join(',\n')}
];
`;
  }

  getRoutePathParts(routePath: string) {
    return getRoutePathParts(
      routePath,
      this.#defaultLang,
      this.#defaultVersion,
      this.#langs,
      this.#versions,
    );
  }

  normalizeRoutePath(routePath: string) {
    return normalizeRoutePath(
      routePath,
      this.#defaultLang,
      this.#defaultVersion,
      this.#langs,
      this.#versions,
      this.#extensions,
    );
  }

  async #writeTempFile(index: number, content: string) {
    const tempFilePath = path.join(this.#tempDir, `temp-${index}.mdx`);
    await fs.writeFile(tempFilePath, content);
    return tempFilePath;
  }

  #generateRouteMeta(routePath: string, filepath: string): RouteMeta {
    const {
      routePath: normalizedPath,
      lang,
      version,
    } = this.normalizeRoutePath(routePath);
    return {
      routePath: normalizedPath,
      absolutePath: normalizePath(filepath),
      relativePath: normalizePath(path.relative(this.#scanDir, filepath)),
      pageName: getPageKey(routePath),
      lang,
      version,
    };
  }

  getRoutePageByRoutePath(routePath: string) {
    return this.routeData.get(routePath);
  }
}
