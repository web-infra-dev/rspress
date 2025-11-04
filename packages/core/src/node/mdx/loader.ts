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
      // Enhance the message with filepath context for better error reporting
      e.message = `MDX compile error: ${e.message} in ${filepath}`;
      // Truncate stack trace to first 10 lines for better readability
      if (e.stack) {
        const stackLines = e.stack.split('\n');
        if (stackLines.length > 10) {
          e.stack =
            stackLines.slice(0, 10).join('\n') + '\n    ... (truncated)';
        }
      }
      callback(e);
    }
  }
}
