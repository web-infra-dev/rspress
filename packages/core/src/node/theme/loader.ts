import type { Rspack } from '@rsbuild/core';
import { exportStarOptimizerTransform } from './exportStarOptimizerTransform.js';

export default async function themeIndexFileOptimizerLoader(
  this: Rspack.LoaderContext<{}>,
  source: string,
) {
  this.cacheable(true);
  const callback = this.async();
  const filepath = this.resourcePath;
  const content = await exportStarOptimizerTransform(source, filepath);
  callback(null, content);
}
