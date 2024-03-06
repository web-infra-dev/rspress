import { existsSync } from 'fs';
import path from 'path';

export const detectCustomIcon = async (customThemeDir: string) => {
  const assetsDir = path.join(customThemeDir, 'assets');

  if (!existsSync(assetsDir)) {
    return;
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
  const alias: Record<string, string> = {};
  files.forEach(file => {
    const name = path.basename(file, '.svg');
    alias[`@theme-assets/${name}`] = path.join(assetsDir, file);
  });
  return alias;
};
