#!/usr/bin/env node

import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MAX_SITE_BYTES = 900 * 1024 * 1024;
const MAX_RECENT_RUNS = 3;

const parseArguments = argv => {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument near ${key ?? '<end>'}`);
    }
    options[key.slice(2)] = value;
  }
  return options;
};

const exists = async filename =>
  stat(filename).then(
    () => true,
    () => false,
  );

const bytesIn = async filename => {
  const info = await stat(filename);
  if (info.isFile()) return info.size;
  if (!info.isDirectory()) return 0;
  const entries = await readdir(filename);
  return (
    await Promise.all(entries.map(entry => bytesIn(path.join(filename, entry))))
  ).reduce((total, bytes) => total + bytes, 0);
};

const mergeReports = async (source, destination) => {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await mergeReports(from, to);
    } else if (entry.isFile()) {
      if (await exists(to)) {
        const [oldBytes, newBytes] = await Promise.all([
          readFile(to),
          readFile(from),
        ]);
        if (!oldBytes.equals(newBytes))
          throw new Error(`Conflicting report asset: ${to}`);
      } else {
        await cp(from, to);
      }
    }
  }
};

const copyShardReports = async (source, destination) => {
  if (!(await exists(source))) return;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^midscene-shard-\d+$/.test(entry.name))
      continue;
    const reports = path.join(source, entry.name, 'midscene_run', 'report');
    if (!(await exists(reports))) continue;
    const destinationReports = path.join(
      destination,
      entry.name,
      'midscene_run',
      'report',
    );
    await mergeReports(reports, destinationReports);
  }
};

export async function preparePagesSite({
  site,
  reports,
  runId,
  previous,
  maxSiteBytes = MAX_SITE_BYTES,
}) {
  if (!/^\d+$/.test(runId)) throw new Error('run-id must be numeric');
  await mkdir(site, { recursive: true });

  if (previous && (await exists(path.join(previous, 'runs')))) {
    await cp(path.join(previous, 'runs'), path.join(site, 'runs'), {
      recursive: true,
    });
  }
  const current = path.join(site, 'runs', runId);
  await rm(current, { recursive: true, force: true });
  await mkdir(current, { recursive: true });
  const nativeReport = path.join(reports, 'native-report');
  if (await exists(path.join(nativeReport, 'index.html'))) {
    await cp(
      path.join(nativeReport, 'index.html'),
      path.join(current, 'index.html'),
    );
  }
  if (await exists(path.join(nativeReport, 'screenshots'))) {
    await cp(
      path.join(nativeReport, 'screenshots'),
      path.join(current, 'screenshots'),
      {
        recursive: true,
      },
    );
  }
  await copyShardReports(reports, current);

  const runsDirectory = path.join(site, 'runs');
  const runIds = (await readdir(runsDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map(entry => entry.name)
    .sort((left, right) => Number(left) - Number(right));
  for (const oldRun of runIds.slice(0, -MAX_RECENT_RUNS)) {
    await rm(path.join(runsDirectory, oldRun), { recursive: true });
  }
  const retainedRunIds = runIds.slice(-MAX_RECENT_RUNS);
  while (
    (await bytesIn(site)) > maxSiteBytes - 10_000 &&
    retainedRunIds.length > 1
  ) {
    const oldRun = retainedRunIds.shift();
    await rm(path.join(runsDirectory, oldRun), { recursive: true });
  }
  const recentLinks = await Promise.all(
    retainedRunIds.map(async id =>
      (await exists(path.join(runsDirectory, id, 'index.html')))
        ? `<li><a href="runs/${id}/index.html">Run ${id}</a></li>`
        : `<li>Run ${id}: partial shard reports are linked from its workflow Summary</li>`,
    ),
  );
  await writeFile(
    path.join(site, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Midscene reports</title><h1>Midscene reports</h1><p>Recent run reports:</p><ul>${recentLinks.join('')}</ul></html>`,
  );
  const bytes = await bytesIn(site);
  if (bytes > maxSiteBytes) {
    throw new Error(
      `Pages site is ${bytes} bytes, above the ${maxSiteBytes}-byte safety limit`,
    );
  }
  return { bytes, runIds: retainedRunIds };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const options = parseArguments(process.argv.slice(2));
  const result = await preparePagesSite({
    site: options.site,
    reports: options.reports,
    runId: options['run-id'],
    previous: options.previous,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
