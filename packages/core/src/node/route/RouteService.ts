import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type AdditionalPage,
  addTrailingSlash,
  type PageModule,
  type RouteMeta,
  RSPRESS_TEMP_DIR,
  removeTrailingSlash,
  type UserConfig,
} from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import type { ComponentType } from 'react';
import { glob } from 'tinyglobby';
import { PUBLIC_DIR } from '../constants';
import { createError } from '../utils';
import {
  getRoutePathParts,
  normalizeRoutePath,
  splitRoutePathParts,
} from './normalizeRoutePath';
import {
  absolutePathToRelativePath,
  absolutePathToRoutePath,
  RoutePage,
} from './RoutePage';

interface InitOptions {
  scanDir: string;
  config: UserConfig;
  externalPages: AdditionalPage[];
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

  #defaultVersion: string;

  #extensions: string[];

  #langs: string[];

  #versions: string[];

  #include: string[];

  #exclude: string[];

  #excludeConvention: string[];

  #tempDir: string;

  #externalPages: AdditionalPage[];

  static __instance__: RouteService | null = null;

  static getInstance(): RouteService {
    return RouteService.__instance__!;
  }

  // The factory to create route service instance
  static async create(options: InitOptions) {
    const { scanDir, config, externalPages } = options;
    const runtimeAbsTempDir = path.join(
      process.cwd(),
      'node_modules',
      RSPRESS_TEMP_DIR,
      'runtime',
    );
    await fs.mkdir(runtimeAbsTempDir, { recursive: true });
    const routeService = new RouteService(
      scanDir,
      config,
      externalPages || [],
      runtimeAbsTempDir,
    );
    RouteService.__instance__ = routeService;
    await routeService.#init();
    return routeService;
  }

  static async createSimple() {
    return new RouteService('', {}, [], '');
  }

  private constructor(
    scanDir: string,
    userConfig: UserConfig,
    externalPages: AdditionalPage[],
    runtimeAbsTempDir: string,
  ) {
    const routeOptions = userConfig?.route || {};
    this.#scanDir = scanDir;
    this.#extensions = routeOptions.extensions || DEFAULT_PAGE_EXTENSIONS;
    this.#include = routeOptions.include || [];
    this.#exclude = routeOptions.exclude || []; // partial mdx components and code samples, e.g: _d.mdx
    this.#excludeConvention = routeOptions.excludeConvention || ['**/_[^_]*']; // partial mdx components and code samples, e.g: _d.mdx
    this.#defaultLang = userConfig?.lang || '';
    this.#langs = (
      userConfig?.locales ??
      userConfig?.themeConfig?.locales ??
      []
    ).map(item => item.lang);

    this.#tempDir = runtimeAbsTempDir;
    this.#externalPages = externalPages;

    if (userConfig.multiVersion) {
      this.#defaultVersion = userConfig.multiVersion.default || '';
      this.#versions = userConfig.multiVersion.versions || [];
    } else {
      this.#defaultVersion = '';
      this.#versions = [];
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
          ...this.#excludeConvention,
          '**/node_modules/**',
          '**/.eslintrc.js',
          '**/.nx/**',
          `./${PUBLIC_DIR}/**`,
          '**/*.d.ts',
        ],
      })
    ).sort();

    files.forEach(filePath => {
      const routePage = RoutePage.create(filePath, this.#scanDir);
      this.addRoute(routePage);
    });

    // 2. external pages added by plugins
    const externalPages = this.#externalPages;

    await Promise.all(
      externalPages.map(async (route, index) => {
        const { routePath, content, filepath } = route;
        // case1: specify the filepath
        if (filepath) {
          const routePage = RoutePage.createFromExternal(
            routePath,
            filepath,
            this.#scanDir,
          );
          this.addRoute(routePage);
          return;
        }
        // case2: specify the content
        if (content) {
          const filepath = await this.#writeTempFile(index, content);
          const routePage = RoutePage.createFromExternal(
            routePath,
            filepath,
            this.#scanDir,
          );
          this.addRoute(routePage);
        }
      }),
    );
  }

  async addRoute(routePage: RoutePage): Promise<void> {
    const {
      routeMeta: { routePath },
    } = routePage;
    if (this.routeData.has(routePath)) {
      throw createError(`routePath ${routePath} has already been added`);
    }
    this.routeData.set(routePath, routePage);
  }

  getRoutes(): RouteMeta[] {
    return Array.from(this.routeData.values()).map(i => i.routeMeta);
  }

  getRoutePages(): RoutePage[] {
    return Array.from(this.routeData.values());
  }

  isExistRoute(link: string): boolean {
    function linkToRoutePath(routePath: string) {
      return decodeURIComponent(routePath.split('#')[0])
        .replace(/\.html$/, '')
        .replace(/\/index$/, '/');
    }

    const cleanLinkPath = linkToRoutePath(link);
    // allow fuzzy matching, e.g: /guide/ and /guide is equal
    // This is a simple judgment, the performance will be better than "matchPath" in react-router-dom
    if (
      !this.routeData.has(removeTrailingSlash(cleanLinkPath)) &&
      !this.routeData.has(addTrailingSlash(cleanLinkPath))
    ) {
      return false;
    }
    return true;
  }

  generateRoutesCode(): string {
    return this.generateRoutesCodeByRouteMeta(this.getRoutes());
  }

  private generateRoutesCodeByRouteMeta(routeMeta: RouteMeta[]) {
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

  getRoutePathParts(relativePath: string) {
    return getRoutePathParts(
      relativePath,
      this.#defaultLang,
      this.#defaultVersion,
      this.#langs,
      this.#versions,
    );
  }

  splitRoutePathParts(relativePath: string) {
    return splitRoutePathParts(
      relativePath,
      this.#defaultLang,
      this.#defaultVersion,
      this.#langs,
      this.#versions,
    );
  }

  normalizeRoutePath(relativePath: string) {
    return normalizeRoutePath(
      relativePath,
      this.#defaultLang,
      this.#defaultVersion,
      this.#langs,
      this.#versions,
      this.#extensions,
    );
  }

  absolutePathToRoutePath(absolutePath: string): string {
    return absolutePathToRoutePath(absolutePath, this.#scanDir, this);
  }

  isInDocsDir(absolutePath: string): boolean {
    const relativePath = path.relative(this.#scanDir, absolutePath);
    return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
  }

  absolutePathToRelativePath(absolutePath: string): string {
    return absolutePathToRelativePath(absolutePath, this.#scanDir);
  }

  async #writeTempFile(index: number, content: string) {
    const tempFilePath = path.join(this.#tempDir, `temp-${index}.mdx`);
    await fs.writeFile(tempFilePath, content);
    return tempFilePath;
  }

  getRoutePageByRoutePath(routePath: string) {
    return this.routeData.get(routePath);
  }

  getDocsDir(): string {
    return this.#scanDir;
  }

  getLangs() {
    return this.#langs;
  }

  getDefaultLang() {
    return this.#defaultLang;
  }
}
