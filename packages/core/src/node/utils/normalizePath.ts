import os from 'node:os';
import path from 'node:path';

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
  normalizeRoutePath: (link: string) => string, // routeService.normalizeRoutePath
): string {
  const relativePath = slash(
    path.relative(
      docsDir,
      absolutePath.replace(path.extname(absolutePath), ''),
    ),
  );
  return normalizeRoutePath(relativePath);
}
