import fs from 'node:fs';
import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { DEFAULT_THEME, PACKAGE_ROOT } from './constants';

function escapePathForRegex(filePath: string): string {
  return filePath
    .split(/[\\/]+/)
    .map(segment => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\\\/]');
}

function getThemeDirPattern(themeDir: string): string {
  const dirs = new Set([path.resolve(themeDir)]);
  try {
    dirs.add(fs.realpathSync(themeDir));
  } catch {
    // Ignore when a virtual/non-existent path is passed in unit tests.
  }
  const patterns = [...dirs].map(escapePathForRegex);
  return patterns.length === 1 ? patterns[0] : `(?:${patterns.join('|')})`;
}

const EMPTY_CSS_PATH = path.join(PACKAGE_ROOT, 'static/empty.css');

/**
 * Rspack plugin for `preset: 'headless'`.
 *
 * Replaces Rspress' built-in default theme global style entry with the minimal
 * headless style entry, and redirects built-in component/layout CSS imports
 * inside `@rspress/core/dist/theme` to an empty stylesheet while preserving
 * user `globalStyles`, custom `theme/` styles, and plugin styles.
 */
export class HeadlessStylePlugin implements Rspack.RspackPluginInstance {
  readonly name = 'RspressHeadlessStylePlugin';

  readonly #themeDir: string;

  readonly #emptyCssPath: string;

  constructor(
    themeDir: string = DEFAULT_THEME,
    emptyCssPath: string = EMPTY_CSS_PATH,
  ) {
    this.#themeDir = themeDir;
    this.#emptyCssPath = emptyCssPath;
  }

  apply(compiler: Rspack.Compiler): void {
    const escapedThemeDir = getThemeDirPattern(this.#themeDir);
    const { NormalModuleReplacementPlugin } = compiler.rspack;

    new NormalModuleReplacementPlugin(
      new RegExp(`^${escapedThemeDir}[\\\\/]styles[\\\\/]index\\.js$`),
      path.join(this.#themeDir, 'styles/headless.js'),
    ).apply(compiler);

    new NormalModuleReplacementPlugin(
      new RegExp(
        `^${escapedThemeDir}[\\\\/](?:components|layout)[\\\\/].*\\.css$`,
      ),
      this.#emptyCssPath,
    ).apply(compiler);
  }
}
