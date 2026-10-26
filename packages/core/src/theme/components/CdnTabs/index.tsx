import { getCustomMDXComponent, Tab, Tabs } from '@rspress/core/theme';
import { useMemo } from 'react';

export type CdnName = 'jsdelivr' | 'unpkg';

export type CdnTabsProps = {
  /** Package name and version, e.g. `bootstrap@5`. */
  package: string;
  /** CSS and JavaScript asset paths within the package. */
  files: ReadonlyArray<string>;
  /** CDNs to display, in tab order. Defaults to jsDelivr and unpkg. */
  cdns?: ReadonlyArray<CdnName>;
};

const DEFAULT_CDNS: ReadonlyArray<CdnName> = ['jsdelivr', 'unpkg'];

const CDN_INFO: Record<CdnName, { label: string; baseUrl: string }> = {
  jsdelivr: {
    label: 'jsDelivr',
    baseUrl: 'https://cdn.jsdelivr.net/npm/',
  },
  unpkg: {
    label: 'unpkg',
    baseUrl: 'https://unpkg.com/',
  },
};

function encodePath(path: string): string {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment).replace(/%40/gi, '@'))
    .join('/');
}

function getAssetUrl(cdn: CdnName, packageName: string, file: string): string {
  return `${CDN_INFO[cdn].baseUrl}${encodePath(packageName)}/${encodePath(file)}`;
}

function getHtmlSnippet(
  cdn: CdnName,
  packageName: string,
  files: ReadonlyArray<string>,
): string {
  return files
    .flatMap(file => {
      const url = getAssetUrl(cdn, packageName, file);
      if (file.toLowerCase().endsWith('.css')) {
        return [`<link rel="stylesheet" href="${url}" />`];
      }
      if (file.toLowerCase().endsWith('.js')) {
        return [`<script src="${url}"></script>`];
      }
      return [];
    })
    .join('\n');
}

export function CdnTabs({
  package: packageName,
  files,
  cdns = DEFAULT_CDNS,
}: CdnTabsProps) {
  const Pre = useMemo(
    () => getCustomMDXComponent().pre,
    [getCustomMDXComponent],
  );
  const tabs = cdns.map(cdn => ({
    cdn,
    label: CDN_INFO[cdn].label,
    code: getHtmlSnippet(cdn, packageName, files),
  }));

  if (import.meta.env.SSG_MD) {
    return tabs
      .map(({ label, code }) => `\n\`\`\`html [${label}]\n${code}\n\`\`\`\n`)
      .join('');
  }

  return (
    <Tabs groupId="cdn">
      {tabs.map(({ cdn, label, code }) => (
        <Tab key={cdn} label={label}>
          <Pre
            lang="html"
            className="shiki css-variables"
            style={{
              backgroundColor: 'var(--shiki-background)',
              color: 'var(--shiki-foreground)',
            }}
          >
            <code style={{ whiteSpace: 'pre' }}>{code}</code>
          </Pre>
        </Tab>
      ))}
    </Tabs>
  );
}
