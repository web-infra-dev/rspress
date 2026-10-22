import { stat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function readNativeResult(reportsDirectory) {
  const root = path.resolve(reportsDirectory);
  const runs = path.join(root, 'midscene-results', '.midscene', 'test-results');
  const entries = await readdir(runs, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const summaries = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(runs, entry.name, 'summary.json');
    try {
      summaries.push({
        file,
        summary: JSON.parse(await readFile(file, 'utf8')),
      });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!summaries.length) return null;
  if (summaries.length !== 1) throw new Error('Expected one Midscene test run');
  const { file, summary } = summaries[0];
  let reportPath = null;
  if (summary.report) {
    const report = path.resolve(path.dirname(file), summary.report);
    const reportRoot = path.join(
      root,
      'midscene-results',
      'midscene_run',
      'report',
    );
    const relative = path.relative(reportRoot, report);
    if (
      relative.startsWith(`..${path.sep}`) ||
      relative === '..' ||
      path.isAbsolute(relative)
    ) {
      throw new Error('Native report escapes the report directory');
    }
    try {
      if ((await stat(report)).isFile())
        reportPath = path.relative(root, report);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return { reportPath, summary, summaryFile: file };
}
