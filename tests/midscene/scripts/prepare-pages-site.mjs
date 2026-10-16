#!/usr/bin/env node

import {
  appendFile,
  cp,
  mkdir,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { readNativeResult } from './native-results.mjs';

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

export async function preparePagesSite({
  site,
  reports,
  runId,
  previous,
  maxSiteBytes = MAX_SITE_BYTES,
}) {
  if (!/^\d+$/.test(runId)) throw new Error('run-id must be numeric');
  const result = await readNativeResult(reports);
  // Incomplete runs keep their downloadable artifacts, without replacing Pages.
  if (!result?.reportPath) return { bytes: 0, runIds: [], reportPath: null };
  await mkdir(site, { recursive: true });

  if (previous && (await exists(path.join(previous, 'runs')))) {
    await cp(path.join(previous, 'runs'), path.join(site, 'runs'), {
      recursive: true,
    });
  }
  const current = path.join(site, 'runs', runId);
  await rm(current, { recursive: true, force: true });
  await mkdir(current, { recursive: true });
  const reportDirectory = path.join(
    'midscene-results',
    'midscene_run',
    'report',
  );
  if (await exists(path.join(reports, reportDirectory))) {
    await cp(
      path.join(reports, reportDirectory),
      path.join(current, reportDirectory),
      {
        recursive: true,
      },
    );
  }
  const href = result.reportPath
    .split(path.sep)
    .map(encodeURIComponent)
    .join('/');
  await writeFile(
    path.join(current, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${href}"><title>Midscene report</title><a href="${href}">Open the Midscene Test report</a></html>`,
  );

  const runsDirectory = path.join(site, 'runs');
  const runIds = (await readdir(runsDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map(entry => entry.name)
    .filter(id => id !== runId)
    .sort((left, right) => Number(left) - Number(right))
    .concat(runId);
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
        : `<li>Run ${id}: partial test reports are linked from its workflow Summary</li>`,
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
  return { bytes, runIds: retainedRunIds, reportPath: `runs/${runId}/` };
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
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `report_path=${result.reportPath ?? ''}\n`,
    );
  }
}
