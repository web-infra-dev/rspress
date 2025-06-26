import type { Rspack } from '@rsbuild/core';
import { logger } from '@rspress/shared/logger';

import { compile, compileWithCrossCompilerCache } from './processor';
import type { MdxLoaderOptions } from './types';

export default async function mdxLoader(
  this: Rspack.LoaderContext<MdxLoaderOptions>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();

  const options = this.getOptions();
  const filepath = this.resourcePath;
  const { config, docDirectory, checkDeadLinks, routeService, pluginDriver } =
    options;

  const crossCompilerCache = config?.markdown?.crossCompilerCache ?? true;

  try {
    // TODO wrong but good enough for now (example: "build --watch")
    if (crossCompilerCache && process.env.NODE_ENV === 'production') {
      const compileResult = await compileWithCrossCompilerCache({
        source,
        filepath,
        docDirectory,
        checkDeadLinks,
        config,
        pluginDriver,
        routeService,
      });
      callback(null, compileResult);
    } else {
      const compileResult = await compile({
        source,
        filepath,
        docDirectory,
        checkDeadLinks,
        config,
        pluginDriver,
        routeService,
      });
      callback(null, compileResult);
    }
  } catch (e) {
    if (e instanceof Error) {
      if (!e.message.includes('Dead link found')) {
        logger.error(`MDX compile error: ${e.message} in ${filepath}`);
      }
      logger.debug(e);
      callback({ message: e.message, name: `${filepath} compile error` });
    }
  }
}
