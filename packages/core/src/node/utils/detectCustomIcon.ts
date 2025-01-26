import { existsSync } from 'node:fs';
import path from 'node:path';
import { glob } from 'tinyglobby';

export const detectCustomIcon = async (customThemeDir: string) => {
  const assetsDir = path.join(customThemeDir, 'assets');
  const alias: Record<string, string> = {};

  if (!existsSync(assetsDir)) {
    return alias;
  }

  const files = await glob('*.svg', {
    cwd: assetsDir,
  });
  files.forEach(file => {
    const name = path.basename(file, '.svg');
    alias[`@theme-assets/${name}`] = path.join(assetsDir, file);
  });
  return alias;
};
