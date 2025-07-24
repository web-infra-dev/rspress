import path from 'node:path';
import type { RouteMeta } from '@rspress/shared';
import { getPageKey } from '../utils/getPageKey';
import { normalizePath, slash } from '../utils/normalizePath';
import { RouteService } from './RouteService';

export class RoutePage {
  routeMeta: RouteMeta;
  // @ts-ignore use this field in the future
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: use this field in the future
  #docDir: string;

  // TODO: add pageIndexInfo
  // pageIndexInfo: PageIndexInfo;

  static create(absolutePath: string, docsDir: string): RoutePage {
    const routeMeta = absolutePathToRouteMeta(
      absolutePath,
      docsDir,
      RouteService.getInstance(),
    );
    return new RoutePage(routeMeta, docsDir);
  }

  static createFromExternal(
    routePath: string,
    filepath: string,
    docDir: string,
  ): RoutePage {
    const routeMeta = RoutePage.generateRouteMeta(routePath, filepath, docDir);
    return new RoutePage(routeMeta, path.dirname(filepath));
  }

  private constructor(routeMeta: RouteMeta, docDir: string) {
    this.routeMeta = routeMeta;
    this.#docDir = docDir;
  }

  static generateRouteMeta(
    routePath: string,
    filepath: string,
    docDir: string,
  ): RouteMeta {
    const routeService = RouteService.getInstance();
    const {
      routePath: normalizedPath,
      lang,
      version,
    } = routeService.normalizeRoutePath(routePath);
    return {
      routePath: normalizedPath,
      absolutePath: normalizePath(filepath),
      relativePath: absolutePathToRelativePath(filepath, docDir),
      pageName: getPageKey(routePath),
      lang,
      version,
    };
  }
}

export function absolutePathToRelativePath(
  absolutePath: string,
  docsDir: string,
): string {
  return slash(path.relative(docsDir, absolutePath));
}

function absolutePathToRouteMeta(
  absolutePath: string,
  docsDir: string,
  routeService: RouteService = RouteService.getInstance(),
): RouteMeta {
  const relativePath = absolutePathToRelativePath(absolutePath, docsDir);

  const { lang, routePath, version } =
    routeService.normalizeRoutePath(relativePath);
  return {
    pageName: getPageKey(relativePath),
    absolutePath,
    lang,
    version,
    routePath,
    relativePath,
  };
}

/**
 *
 * @returns runtime cleanUrl like "/api/guide"
 */
export function absolutePathToRoutePath(
  absolutePath: string,
  docsDir: string,
  routeService = RouteService.getInstance(),
): string {
  return absolutePathToRouteMeta(absolutePath, docsDir, routeService).routePath;
}

function absolutePathToRoutePrefix(
  absolutePath: string,
  docsDir: string,
): string {
  const relativePath = slash(
    path.relative(
      docsDir,
      absolutePath.replace(path.extname(absolutePath), ''),
    ),
  );
  const routeService = RouteService.getInstance();
  const [versionPrefix, langPrefix] =
    routeService.getRoutePathParts(relativePath);
  return `${versionPrefix ? `/${versionPrefix}` : ''}${langPrefix ? `/${langPrefix}` : ''}`;
}

export function addRoutePrefix(
  workDir: string,
  docsDir: string,
  link: string,
): string {
  const routePrefix = absolutePathToRoutePrefix(workDir, docsDir);
  return `${routePrefix.replace(/\/$/, '')}/${link.replace(/^\//, '')}`;
}
