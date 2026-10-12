#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { mergeReportFiles } from '@midscene/core';

import { caseSetIssues, collectReportData } from './render-ci-summary.mjs';

export async function mergeNativeReports(
  reportsDirectory,
  expectedProjects,
  manifestFile,
) {
  const directory = path.resolve(reportsDirectory);
  const { projects } = await collectReportData(directory, expectedProjects);
  if (!projects.length || projects.some(project => !project.reportPath))
    return null;
  if (manifestFile) {
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
    if (caseSetIssues(projects, manifest).length) return null;
  }
  const htmlPaths = projects.map(project =>
    path.join(directory, project.reportPath),
  );

  return mergeReportFiles({
    htmlPaths,
    outputDir: directory,
    outputName: 'native-report',
  }).mergedReportPath;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [reportsDirectory, projects, manifestFile] = process.argv.slice(2);
  if (!reportsDirectory || !projects) {
    throw new Error(
      'Usage: merge-native-reports.mjs <reports-dir> <comma-separated-projects> [case-manifest]',
    );
  }
  const report = await mergeNativeReports(
    reportsDirectory,
    projects.split(','),
    manifestFile,
  );
  if (report) process.stdout.write(`${report}\n`);
  else
    process.stderr.write(
      'Native report unavailable; check shard artifacts and case inventory.\n',
    );
}
