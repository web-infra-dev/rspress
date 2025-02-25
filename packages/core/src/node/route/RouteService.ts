import fs from 'node:fs/promises';
import path from 'node:path';
import type { PageModule, RouteMeta, UserConfig } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import type { ComponentType } from 'react';
import { glob } from 'tinyglobby';
import type { PluginDriver } from '../PluginDriver';
import { PUBLIC_DIR } from '../constants';
import { getPageKey, normalizePath } from '../utils';
import { normalizeRoutePath } from './normalizeRoutePath';

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
  routeData = new Map<string, RouteMeta>();

  #scanDir: string;

  #defaultLang: string;

  #defaultVersion: string = '';

  #extensions: string[] = [];

  #langs: string[] = [];

  #versions: string[] = [];

  #include: string[] = [];

  #exclude: string[] = [];

  #base: string = '';

  #tempDir: string = '';

  #pluginDriver: PluginDriver;

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
    this.#base = userConfig?.base || '';
    this.#tempDir = tempDir;
    this.#pluginDriver = pluginDriver;

    if (userConfig.multiVersion) {
      this.#defaultVersion = userConfig.multiVersion.default || '';
      this.#versions = userConfig.multiVersion.versions || [];
    }
  }

  async init() {
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

      const routeInfo = {
        routePath,
        absolutePath: normalizePath(absolutePath),
        relativePath: fileRelativePath,
        pageName: getPageKey(fileRelativePath),
        lang,
        version,
      };
      this.addRoute(routeInfo);
    });
    // 2. external pages added by plugins
    const externalPages = await this.#pluginDriver.addPages();

    await Promise.all(
      externalPages.map(async (route, index) => {
        const { routePath, content, filepath } = route;
        // case1: specify the filepath
        if (filepath) {
          const routeInfo = this.#generateRouteInfo(routePath, filepath);
          this.addRoute(routeInfo);
          return;
        }
        // case2: specify the content
        if (content) {
          const filepath = await this.#writeTempFile(index, content);
          const routeInfo = this.#generateRouteInfo(routePath, filepath);
          this.addRoute(routeInfo);
        }
      }),
    );

    await this.#pluginDriver.routeGenerated(this.getRoutes());
  }

  addRoute(routeInfo: RouteMeta) {
    const { routePath, absolutePath } = routeInfo;
    if (this.routeData.has(routePath)) {
      // apply the one with the extension listed first in the array and skip the rest.
      const preRouteExtIndex = this.#extensions.indexOf(
        path.extname(this.routeData.get(routePath)!.absolutePath),
      );
      const currRouteExtIndex = this.#extensions.indexOf(
        path.extname(absolutePath),
      );

      if (
        currRouteExtIndex !== -1 &&
        (currRouteExtIndex < preRouteExtIndex || preRouteExtIndex === -1)
      ) {
        this.routeData.set(routePath, routeInfo);
      }
    } else {
      this.routeData.set(routePath, routeInfo);
    }
  }

  removeRoute(filePath: string): void {
    const fileRelativePath = path.relative(this.#scanDir, filePath);
    const { routePath } = this.normalizeRoutePath(fileRelativePath);
    this.routeData.delete(routePath);
  }

  getRoutes(): RouteMeta[] {
    return Array.from(this.routeData.values());
  }

  isExistRoute(routePath: string): boolean {
    const { routePath: normalizedRoute } = this.normalizeRoutePath(routePath);
    return Boolean(this.routeData.get(normalizedRoute));
  }

  isEmpty(): boolean {
    return this.routeData.size === 0;
  }

  generateRoutesCode(isStaticImport = false): string {
    return this.generateRoutesCodeByRouteMeta(this.getRoutes(), isStaticImport);
  }

  generateRoutesCodeByRouteMeta(
    routeMeta: RouteMeta[],
    isStaticImport: boolean,
  ) {
    return `
import React from 'react';
import { lazyWithPreload } from "react-lazy-with-preload";
${routeMeta
  .map((route, index) => {
    return isStaticImport
      ? `import * as Route${index} from '${route.absolutePath}';`
      : `const Route${index} = lazyWithPreload(() => import('${route.absolutePath}'))`;
  })
  .join('\n')}
export const routes = [
${routeMeta
  .map((route, index) => {
    // In ssr, we don't need to import component dynamically.
    const preload = isStaticImport
      ? `() => Route${index}`
      : `async () => {
        await Route${index}.preload();
        return import("${route.absolutePath}");
      }`;
    const component = isStaticImport
      ? `Route${index}.default`
      : `Route${index}`;
    /**
     * For SSR, example:
     * {
     *   route: '/',
     *   element: jsx(Route0),
     *   preload: Route0.preload,
     *   filePath: '/Users/foo/bar/index.md'
     * }
     *
     * For client render, example:
     * {
     *   route: '/',
     *   element: jsx(Route0.default),
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

  normalizeRoutePath(routePath: string) {
    return normalizeRoutePath(
      routePath,
      this.#base,
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

  #generateRouteInfo(routePath: string, filepath: string): RouteMeta {
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
}
