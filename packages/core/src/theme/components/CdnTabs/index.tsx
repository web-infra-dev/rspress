import {
  getCustomMDXComponent,
  IconJsdelivr,
  IconUnpkg,
  SvgWrapper,
  Tab,
  Tabs,
} from '@rspress/core/theme';
import { Fragment, useMemo } from 'react';

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

type AssetTag = {
  tag: 'link' | 'script';
  attributes: Record<string, string>;
};

function getAssetTags(
  cdn: CdnName,
  packageName: string,
  files: ReadonlyArray<string>,
): AssetTag[] {
  return files.flatMap<AssetTag>(file => {
    const url = getAssetUrl(cdn, packageName, file);
    if (file.toLowerCase().endsWith('.css')) {
      return [{ tag: 'link', attributes: { rel: 'stylesheet', href: url } }];
    }
    if (file.toLowerCase().endsWith('.js')) {
      return [{ tag: 'script', attributes: { src: url } }];
    }
    return [];
  });
}

function getHtmlSnippet(tags: AssetTag[]): string {
  return tags
    .map(({ tag, attributes }) => {
      const attrs = Object.entries(attributes)
        .map(([name, value]) => `${name}="${value}"`)
        .join(' ');
      return tag === 'link'
        ? `<${tag} ${attrs} />`
        : `<${tag} ${attrs}></${tag}>`;
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
    tags: getAssetTags(cdn, packageName, files),
  }));

  if (import.meta.env.SSG_MD) {
    return tabs
      .map(
        ({ label, tags }) =>
          `\n\`\`\`html [${label}]\n${getHtmlSnippet(tags)}\n\`\`\`\n`,
      )
      .join('');
  }

  return (
    <Tabs groupId="cdn">
      {tabs.map(({ cdn, label, tags }) => (
        <Tab
          key={cdn}
          value={cdn}
          label={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SvgWrapper
                icon={cdn === 'jsdelivr' ? IconJsdelivr : IconUnpkg}
                width="1em"
                height="1em"
                aria-hidden="true"
              />
              {label}
            </span>
          }
        >
          <Pre
            lang="html"
            className="shiki css-variables"
            style={{
              backgroundColor: 'var(--shiki-background)',
              color: 'var(--shiki-foreground)',
            }}
          >
            <code style={{ whiteSpace: 'pre' }}>
              {/* These generated tags have a fixed grammar, so highlight them directly. */}
              {tags.map(({ tag, attributes }, index) => (
                <Fragment key={index}>
                  {index > 0 ? '\n' : null}
                  <span className="line">
                    {'<'}
                    <span style={{ color: 'var(--shiki-token-keyword)' }}>
                      {tag}
                    </span>
                    {Object.entries(attributes).map(([name, value]) => (
                      <Fragment key={name}>
                        {' '}
                        <span style={{ color: 'var(--shiki-token-function)' }}>
                          {name}
                        </span>
                        {'='}
                        <span
                          style={{
                            color: 'var(--shiki-token-string-expression)',
                          }}
                        >{`"${value}"`}</span>
                      </Fragment>
                    ))}
                    {tag === 'link' ? (
                      ' />'
                    ) : (
                      <>
                        {'></'}
                        <span style={{ color: 'var(--shiki-token-keyword)' }}>
                          {tag}
                        </span>
                        {'>'}
                      </>
                    )}
                  </span>
                </Fragment>
              ))}
            </code>
          </Pre>
        </Tab>
      ))}
    </Tabs>
  );
}
