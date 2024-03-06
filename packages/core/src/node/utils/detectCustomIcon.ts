import { existsSync } from 'fs';
import path from 'path';

export const detectCustomIcon = async (customThemeDir: string) => {
  const assetsDir = path.join(customThemeDir, 'assets');
  const alias: Record<string, string> = {};

  if (!existsSync(assetsDir)) {
    return alias;
  }

  const globby = (
    await import(
      // @ts-expect-error
      // eslint-disable-next-line node/file-extension-in-import
      '../compiled/globby/index.js'
    )
  ).default as typeof import('../../../compiled/globby');
  const files = await globby('*.svg', {
    cwd: assetsDir,
  });
  files.forEach(file => {
    const name = path.basename(file, '.svg');
    alias[`@theme-assets/${name}`] = path.join(assetsDir, file);
  });
  return alias;
};
