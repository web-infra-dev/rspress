import path from 'node:path';

export const PACKAGE_ROOT = path.join(import.meta.dirname, '..');

export const apiDocMap: Record<string, string> = {};
