import os from 'node:os';
import path from 'node:path';
import { RouteService } from '../route/RouteService';

export const isWindows = os.platform() === 'win32';

export function slash(p: string): string {
  return p.replace(/\\/g, '/');
}

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}

/**
 *
 * @returns runtime cleanUrl like "/api/guide"
 */
export function absolutePathToLink(
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
  return routeService.normalizeRoutePath(relativePath).routePath;
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
