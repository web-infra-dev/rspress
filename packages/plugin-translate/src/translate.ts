import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import chalk from '@modern-js/utils/chalk';
import { logger } from '@modern-js/builder-shared';
import cache from 'cacache';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

import { GPTWebKit } from './GPTWebKit';
import { createHash, processPromise, sleep, simplifyPath } from './utils';
import {
  DEFAULT_NEED_TRANSLATE_EXTENSIONS,
  DEFAULT_GPT_MODEL,
  RSPRESS_CACHE_DIR,
  defaultPrompt,
} from './constants';

import { TranslateGen, TranslationRequiredList } from './types';

export const translate = async ({
  match,
  modelConfig,
  getPrompt = defaultPrompt,
  rateLimitPerMinute,
  config,
}: TranslateGen) => {
  const cwd = process.cwd();
  const { root = path.join(cwd, 'docs'), lang, locales } = config;

  if (!config?.lang) {
    throw new Error('Please configure the lang.');
  }
  if ((locales || []).length < 2) {
    throw new Error(
      'Please configure the target language array and create the corresponding folder.',
    );
  }

  const cacheDirPath = path.join(cwd, 'node_modules', RSPRESS_CACHE_DIR);
  const originalLangDir = `${root}/${lang}`;
  const originLangFullName =
    (locales || []).find(({ lang: confLang }) => confLang === lang)?.label ||
    '';
  const needTransLangs = (locales || []).filter(
    ({ lang: confLang }) => confLang !== lang,
  );

  const extensions = match.extensions || DEFAULT_NEED_TRANSLATE_EXTENSIONS;
  const exclude = match.exclude || [];

  const { default: globby } = await import('@modern-js/utils/globby');

  logger.start('[doc-translate-plugin]', `Scanning...`);

  const needTransFiles = globby
    .sync([`**/*.{${extensions.join(',')}}`], {
      cwd: originalLangDir,
      absolute: true,
      ignore: [...exclude],
    })
    .sort();

  const { clientOptions, model = DEFAULT_GPT_MODEL } = modelConfig;
  const gpt = new GPTWebKit(clientOptions, model);
  const enc = encoding_for_model(model as TiktokenModel);

  let count = -1;
  let latestRoundRequestsTime = new Date().getTime();
  const translationRequiredList: TranslationRequiredList[] = [];
  let tokens = 0;

  for (const originalPath of needTransFiles) {
    const originalFileLangContent = fs.readFileSync(originalPath, 'utf-8');
    const [, { integrity: cacheHash }] = await processPromise(
      cache.get(cacheDirPath, originalPath),
      {},
    );
    const indexHash = createHash(originalFileLangContent);

    for (const {
      lang: targetLang,
      label: targetLangFullName,
    } of needTransLangs) {
      const targetPath = originalPath.replace(
        new RegExp(`${root}/${lang}`),
        `${root}/${targetLang}`,
      );

      const isExistTargetLangFile = fs.pathExistsSync(targetPath);

      // various cases of skipping translations
      if (cacheHash && indexHash === cacheHash && isExistTargetLangFile) {
        continue;
      }

      if (!cacheHash && isExistTargetLangFile) {
        await cache.put(cacheDirPath, originalPath, originalFileLangContent);
        continue;
      }

      if (!originalFileLangContent) {
        continue;
      }

      const prompt = getPrompt(
        originalFileLangContent,
        originLangFullName,
        targetLangFullName,
      );

      tokens += enc.encode(prompt).length;

      translationRequiredList.push({
        targetLangFullName,
        targetPath,
        originalPath,
        originalFileLangContent,
        prompt,
      });
    }
  }

  if (translationRequiredList.length) {
    logger.info(
      '[doc-translate-plugin]',
      `Scanned ${chalk.green(
        translationRequiredList.length,
      )} files that need to be translated into the target language. Costs ${chalk.red(
        tokens,
      )} tokens`,
    );
  }

  for (const {
    targetLangFullName,
    targetPath,
    originalPath,
    originalFileLangContent,
    prompt,
  } of translationRequiredList) {
    count++;

    if (count && count % rateLimitPerMinute === 0) {
      const delay = Math.max(
        60000 - (new Date().getTime() - latestRoundRequestsTime),
        0,
      );

      if (delay) {
        logger.warn(
          '[doc-translate-plugin]',
          `Rate limit for requests per minute (RPM) reached: Limit ${chalk.red(
            rateLimitPerMinute,
          )}, current request will be delayed for ${chalk.yellow(
            delay,
          )} ms. The ${chalk.green(
            'rateLimitPerMinute',
          )} parameters can be changed in the plugin configuration`,
        );
        await sleep(delay);
      }

      latestRoundRequestsTime = new Date().getTime();
    }

    // start trans
    logger.start(
      '[doc-translate-plugin]',
      `Translate ${chalk.red(originLangFullName)} documents into ${chalk.green(
        targetLangFullName,
      )}. The file path is ${chalk.yellow(simplifyPath(root, originalPath))}`,
    );

    // TODO: batching optimization
    const translatedContent = await gpt.chat(prompt);

    fs.outputFileSync(targetPath, translatedContent);

    logger.success(
      '[doc-translate-plugin]',
      `Translation of the document into ${chalk.green(
        targetLangFullName,
      )} was successful.`,
    );
    // update cache
    await cache.put(cacheDirPath, originalPath, originalFileLangContent);
  }

  // copying files that do not require translation
  const normalFiles = globby
    .sync(['**/*.*'], {
      cwd: root,
      absolute: true,
      ignore: [
        // ...this.#exclude,
        '**/node_modules/**',
        '**/public/**',
        `**/*.{${extensions.join(',')}}`,
      ],
    })
    .sort();

  normalFiles.forEach(oldPath => {
    needTransLangs.forEach(({ lang: targetLang }) => {
      const newPath = oldPath.replace(
        new RegExp(`${root}/${lang}`),
        `${root}/${targetLang}`,
      );
      if (!fs.pathExistsSync(newPath)) {
        fs.copySync(oldPath, newPath, { overwrite: true });
        logger.info(
          '[doc-translate-plugin]',
          `Successfully copied the ${chalk.yellow(
            simplifyPath(root, newPath),
          )} file without translation!`,
        );
      }
    });
  });

  logger.ready(
    '[doc-translate-plugin]',
    `Translated all documents successfully!`,
  );
};
