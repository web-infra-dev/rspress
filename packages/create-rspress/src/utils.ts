import path from 'node:path';
import fs from 'fs-extra';
import prompts from 'prompts';
import type { CustomPromptObject } from './types';

export async function copyFolder(src: string, dest: string) {
  const renameFiles: Record<string, string> = {
    _gitignore: '.gitignore',
  };

  await fs.mkdir(dest, { recursive: true });
  for (const file of await fs.readdir(src)) {
    const srcFile = path.resolve(src, file);
    const dstFile = renameFiles[file]
      ? path.resolve(dest, renameFiles[file])
      : path.resolve(dest, file);
    const stat = await fs.stat(srcFile);
    if (stat.isDirectory()) {
      await copyFolder(srcFile, dstFile);
    } else {
      await fs.copyFile(srcFile, dstFile);
    }
  }
}

/**
 * replace <%= data %> with variables
 *
 * @example
 * ```ts
 * let str = 'The value of <%= hello %> is <%= hello %>.'
 * const data = {
 *   hello: 'hello world'
 * };
 *
 * console.log(replaceVar(str, data)); // "The value of hello world is hello world."
 *
 * ```
 *
 */
export function replaceVar(
  str: string,
  data: Record<string, any>,
  decorator = '',
) {
  return str.replace(/<%=\s*(.*?)\s*%>/g, (_, key) => {
    const value = data[key.trim()];
    return `${decorator}${value}${decorator}`;
  });
}

/**
 * read file contents
 *
 * replace <%= data %> within the file
 *
 * output the file to targetRoot
 */
export async function renderFile(
  fileSrc: string,
  templateDir: string,
  targetRoot: string,
  data: Record<string, any>,
) {
  const templateFilePath = path.resolve(templateDir, fileSrc);
  const targetPath = path.resolve(targetRoot, fileSrc);

  const file = await fs.readFile(templateFilePath, 'utf-8');
  // in js file, string should be wrapped by single quote
  const decorator = templateFilePath.endsWith('.ts') ? "'" : '';
  const output = replaceVar(file, data, decorator);

  if (!fs.existsSync(targetRoot)) {
    await fs.mkdir(targetRoot, { recursive: true });
  }
  await fs.writeFile(targetPath, output);
}

export function getPkgManager() {
  const ua = process.env.npm_config_user_agent;
  if (!ua) {
    return 'npm';
  }
  const [pkgInfo] = ua.split(' ');
  const [name] = pkgInfo.split('/');
  return name || 'npm';
}

/**
 * format the targetDir
 */
export function formatTargetDir(targetDir: string) {
  return targetDir.trim().replace(/\/+$/g, '');
}

/**
 * custom prompt function
 */
export function initSitePrompts(options: CustomPromptObject[]) {
  const initOptionEvent = (option: CustomPromptObject): CustomPromptObject => {
    option.onState = state => {
      const value = state.value || option.initial;
      option.value = option.formatFn?.(value) || value;
    };

    return option;
  };

  // init formatFn and assign value
  options.forEach(initOptionEvent);

  return prompts(options, { onCancel: cancelPrompt });
}

export const cancelPrompt = () => {
  console.log('Operation cancelled.');
  // eslint-disable-next-line no-process-exit
  process.exit(0);
};
