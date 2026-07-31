import path from 'node:path';

export function getTestOutDir(
  configFile = 'rspress.config.ts',
  fallback = 'doc_build',
) {
  const parallelIndex = process.env.TEST_PARALLEL_INDEX;

  if (parallelIndex === undefined) {
    return fallback;
  }

  const configName = path.basename(configFile).replace(/\.config\.ts$/, '');
  return path.join('doc_build', parallelIndex, configName);
}
