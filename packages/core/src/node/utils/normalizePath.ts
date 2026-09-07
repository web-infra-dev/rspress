import os from 'node:os';
import path from 'node:path';

export const isWindows = os.platform() === 'win32';

export function slash(p: string): string {
  return p.replace(/\\/g, '/');
}

/** Normalize module and route paths to POSIX separators on every platform. */
export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id);
}
