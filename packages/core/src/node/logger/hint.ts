import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { logger } from '@rspress/shared/logger';
import picocolors from 'picocolors';
import { pathExists } from '../utils';

const THEME_DEFAULT_EXPORT_PATTERN = /export\s+default\s+\{/;

/**
 * breaking change hint of theme
 * @see https://github.com/web-infra-dev/rspress/discussions/1891#discussioncomment-12422737
 *
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
      `[Rspress 2.0] breaking change: The theme/index is now using namedExports instead of defaultExports, please update your config file in ${picocolors.greenBright(useDefaultExportFilePath)} (https://github.com/web-infra-dev/rspress/discussions/1891#discussioncomment-12422737).\n`,
      picocolors.redBright(`
- import Theme from '@rspress/theme-default';
- export default {
-  ...Theme,
-  Layout,
- };
- export * from 'rspress/theme';`) +
        picocolors.greenBright(`
+ import { Layout } from '@rspress/theme-default';

+ export { Layout };
+ export * from 'rspress/theme';
`),
    );
  }
}
