import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path, { join } from 'node:path';
import { SEARCH_INDEX_NAME, type UserConfig, isSCM } from '@rspress/shared';
import chalk from '@rspress/shared/chalk';
import { logger } from '@rspress/shared/logger';
import { OUTPUT_DIR, TEMP_DIR, isProduction } from './constants';

export async function writeSearchIndex(config: UserConfig) {
  if (config?.search === false) {
    return;
  }
  const cwd = process.cwd();
  // get all search index files, format is `${SEARCH_INDEX_NAME}.foo.bar.${hash}.json`
  const searchIndexFiles = await fs.readdir(TEMP_DIR);
  const outDir = config?.outDir ?? join(cwd, OUTPUT_DIR);

  // For performance, we only stitch the string of search index data instead of big JavaScript object in memory
  let searchIndexData = '[]';
  let scanning = false;
  for (const searchIndexFile of searchIndexFiles) {
    if (
      !searchIndexFile.includes(SEARCH_INDEX_NAME) ||
      !searchIndexFile.endsWith('.json')
    ) {
      continue;
    }
    const source = join(TEMP_DIR, searchIndexFile);
    const target = join(outDir, 'static', searchIndexFile);
    const searchIndex = await fs.readFile(
      join(TEMP_DIR, searchIndexFile),
      'utf-8',
    );
    searchIndexData = `${searchIndexData.slice(0, -1)}${
      scanning ? ',' : ''
    }${searchIndex.slice(1)}`;
    await fs.rename(source, target);
    scanning = true;
  }

  if (isProduction() && isSCM() && config?.search?.mode === 'remote') {
    const { apiUrl, indexName } = config.search;
    try {
      await fetch(`${apiUrl}?index=${indexName}`, {
        method: 'PUT',
        body: searchIndexData,
        headers: { 'Content-Type': 'application/json' },
      });

      logger.info(
        chalk.green(
          `[doc-tools] Search index uploaded to ${apiUrl}, indexName: ${indexName}`,
        ),
      );
    } catch (e) {
      logger.info(
        chalk.red(
          `[doc-tools] Upload search index \`${indexName}\` failed:\n ${e}`,
        ),
      );
    }
  }
}

type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void;

export function serveSearchIndexMiddleware(config: UserConfig): RequestHandler {
  return (req, res, next) => {
    const searchIndexRequestMatch = `/${SEARCH_INDEX_NAME}.`;
    if (req.url?.includes(searchIndexRequestMatch)) {
      res.setHeader('Content-Type', 'application/json');
      // Get search index name from request url
      const searchIndexFile = req.url?.split('/').pop();
      createReadStream(
        path.join(
          process.cwd(),
          config?.outDir || OUTPUT_DIR,
          'static',
          searchIndexFile,
        ),
        'utf-8',
      ).pipe(res, { end: true });
    } else {
      next?.();
    }
  };
}
