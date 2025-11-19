import fs from 'node:fs/promises';
import path from 'node:path';

async function patchLinks(outputDir: string) {
  // Patch links in markdown files
  // Scan all the markdown files in the output directory
  // replace
  // 1. [foo](bar) -> [foo](./bar)
  // 2. [foo](./bar) -> [foo](./bar) no change
  // 3. [foo](http(s)://...) -> [foo](http(s)://...) no change
  const normalizeLinksInFile = async (filePath: string) => {
    const content = await fs.readFile(filePath, 'utf-8');
    // 1. [foo](bar) -> [foo](./bar)
    const newContent = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, p1, p2) => {
        if (
          // 2. [foo](./bar) -> [foo](./bar) no change
          ['/', '.'].includes(p2[0]) ||
          // 3. [foo](http(s)://...) -> [foo](http(s)://...) no change
          p2.startsWith('http://') ||
          p2.startsWith('https://')
        ) {
          return `[${p1}](${p2})`;
        }
        return `[${p1}](./${p2})`;
      },
    );
    await fs.writeFile(filePath, newContent);
  };

  const traverse = async (dir: string) => {
    const files = await fs.readdir(dir);
    const filePaths = files.map(file => path.join(dir, file));
    const stats = await Promise.all(filePaths.map(fp => fs.stat(fp)));

    await Promise.all(
      stats.map((stat, index) => {
        const file = files[index];
        const filePath = filePaths[index];
        if (stat.isDirectory()) {
          return traverse(filePath);
        }
        if (stat.isFile() && /\.mdx?/.test(file)) {
          return normalizeLinksInFile(filePath);
        }
      }),
    );
  };
  await traverse(outputDir);
}

async function generateMetaJson(absoluteApiDir: string) {
  const metaJsonPath = path.join(absoluteApiDir, '_meta.json');

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
  await fs.writeFile(metaJsonPath, JSON.stringify(['index', ...meta]));
}

export async function patchGeneratedApiDocs(absoluteApiDir: string) {
  await patchLinks(absoluteApiDir);
  await generateMetaJson(absoluteApiDir);
}
