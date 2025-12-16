import type { Rspack } from '@rsbuild/core';
import { exportStarOptimizerTransform } from './exportStarOptimizerTransform.js';

export default async function themeIndexFileOptimizerLoader(
  this: Rspack.LoaderContext<null>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const filepath = this.resourcePath;

  const resolveFn = this.resolve;

  const resolveAsync = (context: string, request: string) => {
    return new Promise<{ path?: string }>((resolve, reject) => {
      resolveFn(
        context,
        request,
        (err: Error | null, filepath: string | false | undefined) => {
          if (err) {
            reject(err);
          } else {
            resolve({ path: filepath as string });
          }
        },
      );
    });
  };

  const content = await exportStarOptimizerTransform(
    source,
    filepath,
    resolveAsync,
  );

  if (process.env.DEBUG === 'RSPRESS_EXPORT_STAR') {
    console.log(
      `--- RSPRESS_EXPORT_STAR DEBUG ---\nFile: ${filepath}\nTransformed Content:\n${content}\n--- END DEBUG ---`,
    );
  }
  callback(null, content);
}
