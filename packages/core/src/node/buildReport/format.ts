export interface PageSize {
  routePath: string;
  html?: number;
  markdown?: number;
}

interface Directory {
  directories: Map<string, Directory>;
  pages: Map<string, PageSize>;
}

interface ReportRow {
  page: string;
  html?: number;
  markdown?: number;
}

const createDirectory = (): Directory => ({
  directories: new Map(),
  pages: new Map(),
});

const compareNames = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function summarize(directory: Directory): Pick<PageSize, 'html' | 'markdown'> {
  const sizes: Pick<PageSize, 'html' | 'markdown'> = {};
  const entries = [
    ...directory.pages.values(),
    ...Array.from(directory.directories.values(), summarize),
  ];

  for (const entry of entries) {
    for (const column of ['html', 'markdown'] as const) {
      if (entry[column] !== undefined) {
        sizes[column] = (sizes[column] ?? 0) + entry[column];
      }
    }
  }

  return sizes;
}

function appendDirectoryRows(
  directory: Directory,
  prefix: string,
  rows: ReportRow[],
) {
  const directories = Array.from(directory.directories).sort(([a], [b]) =>
    compareNames(a, b),
  );
  const pages = Array.from(directory.pages).sort(([a], [b]) => {
    if (a === 'index' && b !== 'index') {
      return -1;
    }
    if (b === 'index' && a !== 'index') {
      return 1;
    }
    return compareNames(a, b);
  });
  const entryCount = directories.length + pages.length;

  directories.forEach(([name, child], index) => {
    const isLast = index === entryCount - 1;
    rows.push({
      page: `${prefix}${isLast ? '└─' : '├─'} ${name}/`,
      ...summarize(child),
    });
    appendDirectoryRows(child, `${prefix}${isLast ? '   ' : '│  '}`, rows);
  });

  pages.forEach(([name, sizes], index) => {
    const isLast = directories.length + index === entryCount - 1;
    rows.push({
      page: `${prefix}${isLast ? '└─' : '├─'} ${name}`,
      html: sizes.html,
      markdown: sizes.markdown,
    });
  });
}

function formatSize(size: number | undefined): string {
  if (size === undefined) {
    return '-';
  }
  const kilobytes = size / 1000;
  return `${kilobytes.toFixed(kilobytes < 1 ? 2 : 1)} kB`;
}

// CJK characters occupy two terminal columns, unlike the tree drawing symbols.
function displayWidth(value: string): number {
  let width = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    const isWide =
      codePoint >= 0x1100 &&
      (codePoint <= 0x115f ||
        (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
        (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
        (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
        (codePoint >= 0xfe10 && codePoint <= 0xfe6f) ||
        (codePoint >= 0xff00 && codePoint <= 0xff60) ||
        (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
        (codePoint >= 0x20000 && codePoint <= 0x3fffd));
    width += isWide ? 2 : 1;
  }
  return width;
}

export function formatBuildReport(
  pages: PageSize[],
  columns: { html: boolean; markdown: boolean },
): string {
  const enabledColumns = (['html', 'markdown'] as const).filter(
    column => columns[column],
  );
  if (pages.length === 0 || enabledColumns.length === 0) {
    return '';
  }

  const root = createDirectory();
  for (const page of pages) {
    const segments = page.routePath.split('/').filter(Boolean);
    if (page.routePath.endsWith('/')) {
      segments.push('index');
    }
    const name = segments.pop() ?? 'index';
    let directory = root;
    for (const segment of segments) {
      let child = directory.directories.get(segment);
      if (!child) {
        child = createDirectory();
        directory.directories.set(segment, child);
      }
      directory = child;
    }
    directory.pages.set(name, page);
  }

  const rows: ReportRow[] = [{ page: '/', ...summarize(root) }];
  appendDirectoryRows(root, '', rows);

  const headings = {
    html: 'HTML',
    markdown: 'Markdown',
  };
  const table = [
    ['Page (raw size)', ...enabledColumns.map(column => headings[column])],
    ...rows.map(row => [
      row.page,
      ...enabledColumns.map(column => formatSize(row[column])),
    ]),
  ];
  const widths = table[0].map((_, index) =>
    table.reduce((width, row) => Math.max(width, displayWidth(row[index])), 0),
  );

  return table
    .map(row =>
      row
        .map((value, index) => {
          const padding = ' '.repeat(widths[index] - displayWidth(value));
          return index === 0 ? value + padding : padding + value;
        })
        .join('  ')
        .trimEnd(),
    )
    .join('\n');
}
