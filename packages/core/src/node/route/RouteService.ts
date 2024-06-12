import path from 'node:path';
import type { ComponentType } from 'react';
import fs from '@rspress/shared/fs-extra';
import {
  addLeadingSlash,
  addTrailingSlash,
  type PageModule,
  type UserConfig,
  type RouteMeta,
  withBase,
} from '@rspress/shared';
import { getPageKey, normalizePath } from '../utils';
import type { PluginDriver } from '../PluginDriver';

export const DEFAULT_PAGE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'];

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

export const normalizeRoutePath = (
  routePath: string,
  base: string,
  lang: string,
  version: string,
  langs: string[],
  versions: string[],
  extensions: string[] = DEFAULT_PAGE_EXTENSIONS,
) => {
  const hasTrailSlash = routePath.endsWith('/');
  let versionPart = '';
  let langPart = '';
  let purePathPart = '';
  const parts: string[] = routePath.split('/').filter(Boolean);

  if (version) {
    const versionToMatch = parts[0];
    if (versions.includes(versionToMatch)) {
      if (versionToMatch !== version) {
        versionPart = versionToMatch;
      }
      parts.shift();
    }
  }

  if (lang) {
    const langToMatch = parts[0];
    if (langs.includes(langToMatch)) {
      if (langToMatch !== lang) {
        langPart = langToMatch;
      }
      parts.shift();
    }
  }
  purePathPart = parts.join('/');

  let normalizedRoutePath = addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
  )
    // remove the extension
    .replace(new RegExp(`\\.(${extensions.join('|')})$`), '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');

  // restore the trail slash
  if (hasTrailSlash) {
    normalizedRoutePath = addTrailingSlash(normalizedRoutePath);
  }

  return {
    routePath: withBase(normalizedRoutePath, base),
    lang: langPart || lang,
    version: versionPart || version,
  };
};

export class RouteService {
  routeData: Map<string, RouteMeta> = new Map();

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
    const globby = (
      await import(
        // @ts-expect-error
        // eslint-disable-next-line node/file-extension-in-import
        '../compiled/globby/index.js'
      )
    ).default as typeof import('../../../compiled/globby');
    // 1. internal pages
    const files = globby
      .sync([`**/*.{${this.#extensions.join(',')}}`, ...this.#include], {
        cwd: this.#scanDir,
        absolute: true,
        ignore: [
          ...this.#exclude,
          '**/node_modules/**',
          '**/.eslintrc.js',
          '**/.nx-cache/**',
        ],
      })
      .sort();
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
        path.extname(this.routeData.get(routePath)!.absolutePath).slice(1),
      );
      const currRouteExtIndex = this.#extensions.indexOf(
        path.extname(absolutePath).slice(1),
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

  removeRoute(filePath: string) {
    const fileRelativePath = path.relative(this.#scanDir, filePath);
    const { routePath } = this.normalizeRoutePath(fileRelativePath);
    this.routeData.delete(routePath);
  }

  getRoutes() {
    return Array.from(this.routeData.values());
  }

  isExistRoute(routePath: string) {
    const { routePath: normalizedRoute } = this.normalizeRoutePath(routePath);
    return this.routeData.get(normalizedRoute);
  }

  isEmpty() {
    return this.routeData.size === 0;
  }

  generateRoutesCode(isStaticImport = false) {
    return this.generateRoutesCodeByRouteMeta(this.getRoutes(), isStaticImport);
  }

  generateRoutesCodeByRouteMeta(
    routeMeta: RouteMeta[],
    isStaticImport: boolean,
  ) {
    // TODO: webpackChunkName need fix https://github.com/web-infra-dev/rspack/issues/4664

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
