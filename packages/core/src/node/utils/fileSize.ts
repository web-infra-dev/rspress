import type { PerformanceConfig } from '@rsbuild/core';

type PrintFileSize = NonNullable<PerformanceConfig['printFileSize']>;
type Options = Exclude<PrintFileSize, boolean>;
type TotalFormatter = Exclude<Options['total'], boolean | undefined>;

interface Directory {
  files: number;
  size: number;
  ownFiles: number;
  ownSize: number;
  children: Map<string, Directory>;
}

const createDirectory = (): Directory => ({
  files: 0,
  size: 0,
  ownFiles: 0,
  ownSize: 0,
  children: new Map(),
});

const formatSize = (bytes: number) => {
  const size = bytes / 1000;
  return `${size.toFixed(size < 1 ? 2 : 1)} kB`;
};

export const formatFileSize: TotalFormatter = ({
  environmentName,
  distPath,
  assets,
  totalSize,
  totalGzipSize,
  totalBrotliSize,
}) => {
  const root = createDirectory();
  for (const { name, size } of assets) {
    let directory = root;
    directory.files++;
    directory.size += size;
    for (const segment of name.replace(/\\/g, '/').split('/').slice(0, -1)) {
      let child = directory.children.get(segment);
      if (!child) {
        child = createDirectory();
        directory.children.set(segment, child);
      }
      directory = child;
      directory.files++;
      directory.size += size;
    }
    directory.ownFiles++;
    directory.ownSize += size;
  }

  const outputPath = (distPath || '.').replace(/\\/g, '/').replace(/\/$/, '');
  const count = (files: number) => `${files} ${files === 1 ? 'file' : 'files'}`;
  const lines = [
    `Output (${environmentName}): ${outputPath}/ (${count(assets.length)})`,
  ];
  const append = (directory: Directory, prefix: string) => {
    const entries = [...directory.children]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, child]) => ({ name: `${name}/`, ...child }));
    // Direct files only need a separate row when a directory has subdirectories.
    if (entries.length && directory.ownFiles) {
      entries.push({
        name: '(files)',
        ...createDirectory(),
        files: directory.ownFiles,
        size: directory.ownSize,
      });
    }
    entries.forEach((entry, index) => {
      const last = index === entries.length - 1;
      lines.push(
        `${prefix}${last ? '└─' : '├─'} ${entry.name} (${count(entry.files)}, ${formatSize(entry.size)})`,
      );
      append(entry, `${prefix}${last ? '   ' : '│  '}`);
    });
  };
  append(root, '');

  let total = `Total size (${environmentName}): ${formatSize(totalSize)}`;
  if (totalBrotliSize !== undefined) {
    total += ` (${formatSize(totalBrotliSize)} brotli)`;
  } else if (totalGzipSize > 0) {
    total += ` (${formatSize(totalGzipSize)} gzipped)`;
  }
  lines.push(total);
  return lines.join('\n');
};

export function withFileSizeSummary(options: PrintFileSize): PrintFileSize {
  if (
    typeof options !== 'object' ||
    options.detail !== false ||
    options.total !== undefined ||
    options.diff
  ) {
    return options;
  }
  return { ...options, total: formatFileSize };
}
