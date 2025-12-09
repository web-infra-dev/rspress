import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Only generate the `docs/api/_meta.json` at the first time
 */
async function generateMetaJson(absoluteApiDir: string) {
  const metaJsonPath = path.join(absoluteApiDir, '_meta.json');
  if (
    await fs
      .access(metaJsonPath)
      .then(() => true)
      .catch(() => false)
  ) {
    return;
  }

  const files = await fs.readdir(absoluteApiDir);
  const filePaths = files.map(file => path.join(absoluteApiDir, file));
  const stats = await Promise.all(filePaths.map(fp => fs.stat(fp)));
  const dirs = stats
    .map((stat, index) => (stat.isDirectory() ? files[index] : null))
    .filter(Boolean) as string[];

  const meta = dirs.map(dir => ({
    type: 'dir',
    label: dir.slice(0, 1).toUpperCase() + dir.slice(1),
    name: dir,
  }));
  await fs.writeFile(metaJsonPath, JSON.stringify(['index', ...meta], null, 2));
}

export async function patchGeneratedApiDocs(absoluteApiDir: string) {
  await generateMetaJson(absoluteApiDir);
}
