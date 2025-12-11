/**
 * these codes are copied from
 * @link https://github.com/facebook/docusaurus/blob/45065e8d2b5831117b8d69fec1be28f5520cf105/packages/docusaurus/src/ssg/ssgEnv.ts#L11
 * @license MIT
 */

import os from 'node:os';

function SSGWorkerThreadTaskSize() {
  return process.env.RSPRESS_SSG_WORKER_THREAD_TASK_SIZE
    ? Number.parseInt(process.env.RSPRESS_SSG_WORKER_THREAD_TASK_SIZE, 10)
    : 10;
}
function SSGWorkerThreadRecyclerMaxMemory(): number | undefined {
  return process.env.RSPRESS_SSG_WORKER_THREAD_RECYCLER_MAX_MEMORY
    ? Number.parseInt(
        process.env.RSPRESS_SSG_WORKER_THREAD_RECYCLER_MAX_MEMORY,
        10,
      )
    : // 1 GB is a quite reasonable max value
      // It should work well even for large sites
      1_000_000_000;
}

function inferNumberOfThreads({
  pageCount,
  cpuCount,
  minPagesPerCpu,
}: {
  pageCount: number;
  cpuCount: number;
  minPagesPerCpu: number;
}) {
  // Calculate "ideal" amount of threads based on the number of pages to render
  const threadsByWorkload = Math.ceil(pageCount / minPagesPerCpu);
  // Use the smallest of threadsByWorkload or cpuCount, ensuring min=1 thread
  return Math.max(1, Math.min(threadsByWorkload, cpuCount));
}

function SSGWorkerThreadCount(): number | undefined {
  return process.env.RSPRESS_SSG_WORKER_THREAD_COUNT
    ? Number.parseInt(process.env.RSPRESS_SSG_WORKER_THREAD_COUNT, 10)
    : undefined;
}

function getNumberOfThreads(pathnamesLength: number): number {
  const workerCount = SSGWorkerThreadCount();
  if (typeof workerCount !== 'undefined') {
    return workerCount;
  }

  // See also https://github.com/tinylibs/tinypool/pull/108
  const cpuCount =
    typeof os.availableParallelism === 'function'
      ? os.availableParallelism()
      : os.cpus().length;

  return inferNumberOfThreads({
    pageCount: pathnamesLength,
    cpuCount,
    // These are "magic value" that we should refine based on user feedback
    // Local tests show that it's not worth spawning new workers for few pages
    minPagesPerCpu: 100,
  });
}
function SSGConcurrency() {
  return process.env.RSPRESS_SSG_CONCURRENCY
    ? Number.parseInt(process.env.RSPRESS_SSG_CONCURRENCY, 10)
    : // Not easy to define a reasonable option default
      // Will still be better than Infinity
      // See also https://github.com/sindresorhus/p-map/issues/24
      32;
}

export {
  SSGWorkerThreadRecyclerMaxMemory,
  SSGWorkerThreadTaskSize,
  SSGConcurrency,
  getNumberOfThreads,
};
