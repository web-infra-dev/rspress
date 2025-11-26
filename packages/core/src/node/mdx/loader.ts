import type { Rspack } from '@rsbuild/core';

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
  const {
    config,
    docDirectory,
    routeService,
    pluginDriver,
    isSsgMd = false,
  } = options;

  const crossCompilerCache = config?.markdown?.crossCompilerCache ?? true;

  try {
    // TODO wrong but good enough for now (example: "build --watch")
    if (
      crossCompilerCache &&
      process.env.NODE_ENV === 'production' &&
      !isSsgMd
    ) {
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
        isSsgMd,
      });
      callback(null, compileResult);
    }
  } catch (e) {
    if (e instanceof Error) {
      // Enhance the message with filepath context for better error reporting
      const message = `MDX compile error: ${e.message} in ${filepath}`;
      let stack: string | undefined = e.stack;
      // Truncate stack trace to first 10 lines for better readability
      if (stack) {
        const stackLines = stack.split('\n');
        if (stackLines.length > 10) {
          stack = `${stackLines.slice(0, 10).join('\n')}\n    ... (truncated)`;
        }
      }
      // why not `callback(e)` ?
      // https://github.com/web-infra-dev/rspack/issues/12080
      callback({
        message,
        ...(stack ? { stack } : {}),
        name: e.name,
        cause: e.cause,
      } as Error);
    }
  }
}
