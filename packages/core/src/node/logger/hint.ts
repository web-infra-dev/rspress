import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '@rsbuild/core';
import picocolors from 'picocolors';
import { pathExists } from '../utils';

const THEME_DEFAULT_EXPORT_PATTERN = /export default \{(.*?)\}/m;

/**
 * breaking change
 */
export async function hintThemeBreakingChange(customThemeDir: string) {
  const fileList = ['index.ts', 'index.tsx', 'index.js', 'index.mjs'];
  let useDefaultExportFilePath: string | null = null;
  for (const file of fileList) {
    const filePath = join(customThemeDir, file);
    if (await pathExists(filePath)) {
      const content = await readFile(filePath, { encoding: 'utf-8' });
      if (THEME_DEFAULT_EXPORT_PATTERN.test(content)) {
        useDefaultExportFilePath = filePath;
      }
      break;
    }
  }
  if (useDefaultExportFilePath) {
    logger.warn(
      `[Rspress] Theme breaking change: The theme/index is now using namedExports instead of defaultExports, please update your config file in ${useDefaultExportFilePath}`,
      picocolors.red(`
- import Theme from '@rspress/theme-default';
- export default {
-  ...Theme,
-  Layout,
- };
- export * from 'rspress/theme';`) +
        picocolors.green(`+ import { Layout } from '@rspress/theme-default';

+ export { Layout };
+ export * from 'rspress/theme';
`),
    );
  }
}
