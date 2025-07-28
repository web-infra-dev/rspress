import { logger, type Rspack } from '@rsbuild/core';

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
  const { config, docDirectory, routeService, pluginDriver } = options;

  const crossCompilerCache = config?.markdown?.crossCompilerCache ?? true;

  try {
    // TODO wrong but good enough for now (example: "build --watch")
    if (crossCompilerCache && process.env.NODE_ENV === 'production') {
      const compileResult = await compileWithCrossCompilerCache({
        source,
        filepath,
        docDirectory,
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
        config,
        pluginDriver,
        routeService,
        addDependency: this.addDependency,
      });
      callback(null, compileResult);
    }
  } catch (e) {
    if (e instanceof Error) {
      logger.debug(e);
      callback({
        message: `MDX compile error: ${e.message} in ${filepath}`,
        name: `${filepath} compile error`,
      });
    }
  }
}
