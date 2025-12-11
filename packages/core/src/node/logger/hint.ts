import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import picocolors from 'picocolors';
import type { NavJson } from '../auto-nav-sidebar/type';
import { pathExists } from '../utils';

const THEME_DEFAULT_EXPORT_PATTERN = /export\s+default\s+\{/;

const THEME_OLD_IMPORT_0 = /from\s+['"]rspress\/theme['"]/;
const THEME_OLD_IMPORT_1 = /from\s+['"]@rspress\/core\/theme['"]/;

/**
 * breaking change hint of theme
 * @see https://github.com/web-infra-dev/rspress/discussions/1891#discussioncomment-12422737
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
        break;
      }
      if (
        THEME_OLD_IMPORT_0.test(content) ||
        THEME_OLD_IMPORT_1.test(content)
      ) {
        useDefaultExportFilePath = filePath;
        break;
      }
    }
  }
  if (useDefaultExportFilePath) {
    logger.warn(
      `[Rspress v2] Breaking Change: The "theme/index.tsx" is now using named export from '@rspress/core/theme-original' instead of default export from 'rspress/theme', please update ${picocolors.greenBright(useDefaultExportFilePath)} (https://github.com/web-infra-dev/rspress/discussions/1891#discussioncomment-12422737).\n`,
      picocolors.redBright(`
- import Theme from 'rspress/theme';
- export default {
-  ...Theme,
-  Layout,
- };
- export * from 'rspress/theme';`) +
        picocolors.greenBright(`
+ import { Layout } from '@rspress/core/theme-original';

+ export { Layout };
+ export * from '@rspress/core/theme-original';
`),
    );
  }
}

export function hintBuilderPluginsBreakingChange(config: UserConfig) {
  if (
    // config.builderPlugins is removed in V2
    'builderPlugins' in config &&
    Array.isArray(config.builderPlugins) &&
    config.builderPlugins.length > 0
  ) {
    logger.error(
      `[Rspress v2] The "builderPlugins" option has been renamed to "builderConfig.plugins", please update your config accordingly (https://rspress.rs/api/config/config-build#builderconfigplugins).\n`,
      `
export default defineConfig({
${picocolors.redBright(
  `  builderPlugins: [
    pluginFoo()
  ],`,
)}
${picocolors.greenBright(`  builderConfig: {
    plugins: [
      pluginFoo()
    ],
  },`)}
});`,
    );
    process.exit(1);
  }
}

/**
 * Possible reasons for printing "ssg: false" and some troubleshooting guidelines for users.
 */
export function hintSSGFailed() {
  logger.info(`[Rspress v2] \`ssg: true\` requires the source code to support SSR. If the code is not compatible to SSR, the build process will fail. You can try:
    1. Fix code to make it SSR-compatible.
    2. Set \`ssg: false\` if the code in node_modules may be difficult to fix, but the SSG feature will be lost.`);
}

/**
 * Print "ssg: false" explicitly to give users a clear perception.
 */
export function hintSSGFalse() {
  logger.info('`ssg: false` detected, SSG will be disabled.');
}

export function hintReactVersion() {
  logger.info(
    '[Rspress v2] Rspress support React 18 and 19, please confirm that both react and react-dom are installed in package.json with the same version. ',
  );
}

export function hintNavJsonChangeThenPanic(
  metaJson: NavJson,
  metaJsonDir: string,
  docsDir: string,
): void {
  if (
    metaJson.some(i => {
      return (
        typeof i === 'object' &&
        ('activeMatch' in i ||
          'text' in i ||
          'link' in i ||
          'items' in i ||
          'icon' in i ||
          'ariaLabel' in i ||
          'target' in i)
      );
    })
  ) {
    const error = new Error(
      '[Rspress v2] Detected that you are still using top level `_meta.json` to configure the nav, but it has been changed to `_nav.json` in Rspress v2. Please rename the top level `_meta.json` to `_nav.json` accordingly.',
    );
    logger.error(error);

    const dir = relative(docsDir, metaJsonDir);
    logger.info(
      `Please rename "${picocolors.greenBright(join(dir, '_meta.json'))}" to  "${picocolors.greenBright(join(dir, '_nav.json'))}".`,
    );
    process.exit(1);
  }
}

let isLogged = false;
export function hintRelativeMarkdownLink() {
  if (isLogged) {
    return;
  }
  isLogged = true;
  logger.info(
    '[Rspress v2] Markdown links without "./" prefix are now relative links, e.g: [](guide/getting-started) is equal to [](./guide/getting-started). You can rewrite it to [](/guide/getting-started) to always use absolute links, or use [](./getting-started.md)',
  );
}
