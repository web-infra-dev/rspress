import fs from 'node:fs/promises';
import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { createError } from './error';

// Normalize path separators to forward slashes
function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/');
}

/**
 * Recursively retrieves all Markdown files (.md and .mdx) from a directory.
 * @param dirPath - Target directory path
 * @returns Array of file paths
 */
async function getAllMarkdownFilesFrom(dirPath: string): Promise<string[]> {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  const allFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      // Recursively process subdirectories
      const nestedFiles = await getAllMarkdownFilesFrom(fullPath);
      allFiles.push(...nestedFiles);
    } else if (['.md', '.mdx'].includes(path.extname(file.name))) {
      // Add Markdown files to the result
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

/**
 * Collects Markdown files for a specific language directory
 * @param contentPath - root path
 * @param lang - language for this directory
 * @param includedDir - Module path to check
 * @param excludedDirs - List of directories to exclude
 * @param fileLangMap - Mapping of file names to the set of languages that include them
 * @returns A mapping of file names to the set of languages that include them
 */
async function collectModuleFiles(
  contentPath: string,
  lang: string,
  includedDir: string,
  excludedDirs: string[],
  fileLangMap: Record<string, Set<string>>,
): Promise<Record<string, Set<string>>> {
  const langDirPath = path.join(contentPath, lang);
  const langModuleDir = path.join(langDirPath, includedDir);

  try {
    const moduleDirStats = await fs.stat(langModuleDir);
    if (!moduleDirStats.isDirectory()) return fileLangMap;

    // Recursively collect Markdown files
    const files = await getAllMarkdownFilesFrom(langModuleDir);
    for (const file of files) {
      const relativePath = normalizePath(path.relative(langDirPath, file));
      // exclude may includes path and files
      if (
        excludedDirs.some(excludedDir => {
          const isFilePath = /\.(md|mdx)$/.test(excludedDir);
          return relativePath.includes(excludedDir + (isFilePath ? '' : '/'));
        })
      )
        continue;

      const baseName = relativePath;
      if (!fileLangMap[baseName]) fileLangMap[baseName] = new Set();
      fileLangMap[baseName].add(lang);
    }
  } catch (e) {
    logger.error(e);
    throw createError(
      `Failed to access directory: ${normalizePath(langModuleDir)}`,
    );
  }

  return fileLangMap;
}

/**
 * Checks the parity of language files across multiple languages.
 */
export async function checkLanguageParity(config: UserConfig) {
  if (!config?.languageParity || config.languageParity.enabled === false) {
    return;
  }

  logger.info('Checking language parity...');
  const contentPath = path.resolve(config.root!);
  const includedDirs = config.languageParity.include?.length
    ? config.languageParity.include
    : ['']; // Default: check all directories
  const excludedDirs = config.languageParity.exclude ?? [];
  const supportedLanguages =
    (config.locales ?? config.themeConfig?.locales)?.map(
      locale => locale.lang,
    ) || [];

  if (!supportedLanguages.length) {
    logger.error('No supported languages found in the configuration.');
    return;
  }

  const missingLanguagesFile: string[] = [];
  try {
    // Process each include path
    for (const includedDir of includedDirs) {
      if (excludedDirs.some(excludedDir => excludedDir === includedDir))
        continue;

      const curFileLangMap: Record<string, Set<string>> = {};
      for (const lang of supportedLanguages) {
        await collectModuleFiles(
          contentPath,
          lang,
          includedDir,
          excludedDirs,
          curFileLangMap,
        );
      }
      // Check for missing language versions
      for (const [baseName, langs] of Object.entries(curFileLangMap)) {
        const missingLangs = supportedLanguages.filter(
          lang => !langs.has(lang),
        );
        missingLangs.forEach(lang => {
          const missingPath = path.join(lang, baseName);
          missingLanguagesFile.push(missingPath);
        });
      }
    }

    if (missingLanguagesFile.length > 0) {
      throw createError(
        `Check language parity failed! Missing content:\n${missingLanguagesFile
          .map(file => `        - ${normalizePath(file)}`)
          .join('\n')}`,
      );
    }
    logger.success('Language parity checked successfully.');
  } catch (err) {
    logger.error('Error during language parity check: \n', err);
    throw err;
  }
}
