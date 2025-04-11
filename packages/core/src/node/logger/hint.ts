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
      `[Rspress v2] Breaking Change: The "theme/index.tsx" is now using named export instead of default export, please update ${picocolors.greenBright(useDefaultExportFilePath)} (https://github.com/web-infra-dev/rspress/discussions/1891#discussioncomment-12422737).\n`,
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

export function hintSSGFailed() {
  logger.info(`[Rspress v2] \`ssg: true\` requires the source code to support SSR. If the code is not compatible to SSR, the build process will fail. You can try:
    1. Fixed code to make it SSR-compatible.
    2. Set \`ssg: false\`, but the SSG feature will be lost.`);
}

export function hintSSGFalse() {
  logger.info('`ssg: false` detected, SSG will be disabled.');
}
