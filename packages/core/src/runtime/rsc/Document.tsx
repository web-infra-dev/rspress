'use server-entry';

import React from 'react';
import type { PageDataLegacy, RouteMeta, UserConfig } from '@rspress/shared';
import siteData from 'virtual-site-data';
import { normalizeImagePath } from '../utils';
import {
  RscClientProviders,
  RscDocChrome,
  RscNavChrome,
  RscNotFoundChrome,
  RscOverviewChrome,
} from '../rscClientReferences';

const inlineThemeScript = `{
  const saved = localStorage.getItem('rspress-theme-appearance')
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = !saved || saved === 'auto' ? preferDark : saved === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('rp-dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}`
  .replace(/\n/g, ';')
  .replace(/\s{2,}/g, '');

type PageComponent = React.ComponentType<unknown>;

export default function RspressRscDocument({
  page,
  PageComponent,
  configHead,
  routeMeta,
}: {
  page: PageDataLegacy['page'];
  PageComponent: PageComponent;
  configHead?: UserConfig['head'];
  routeMeta: RouteMeta;
}) {
  const frontmatter = page.frontmatter || {};
  const pageType = page.pageType;
  const showNavbar = frontmatter.navbar !== false && pageType !== 'blank';
  const pageTitle = getDocumentTitle(page);
  const description = getDocumentDescription(page);
  const RenderedPage = PageComponent as React.ComponentType<{
    components?: Record<string, unknown>;
  }>;
  const mdxComponents = {
    ...getRscMdxComponents(),
    $$$callout$$$: RscCallout,
  };

  const pageContent = (
    <>
      {shouldRenderFallbackTitle(page) && (
        <h1 className="rp-toc-include">{page.title}</h1>
      )}
      <RenderedPage components={mdxComponents} />
    </>
  );

  let content: React.ReactNode;
  if (pageType === 'home') {
    content = <RscHomeLayout frontmatter={frontmatter} />;
  } else if (pageType === 'doc' || pageType === 'doc-wide') {
    const overviewContent = <RscOverviewChrome content={pageContent} />;
    content = <RscDocChrome content={pageContent} overviewContent={overviewContent} />;
  } else if (pageType === '404') {
    content = <RscNotFoundChrome />;
  } else {
    content = pageContent;
  }

  return (
    <html lang={page.lang || 'en'}>
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="generator" content="Rspress" />
        <title>{pageTitle || undefined}</title>
        {description ? <meta name="description" content={description} /> : null}
        {renderHeadTags(configHead, routeMeta)}
        {renderFrontmatterHead(frontmatter.head)}
        <script dangerouslySetInnerHTML={{ __html: inlineThemeScript }} />
      </head>
      <body>
        <RscClientProviders page={page}>
          <div id="__rspress_root">
            {showNavbar ? <RscNavChrome /> : null}
            {content}
          </div>
          <div id="__rspress_modal_container" />
        </RscClientProviders>
      </body>
    </html>
  );
}

function shouldRenderFallbackTitle(page: PageDataLegacy['page']) {
  return page.pageType !== 'home' && !page.headingTitle && Boolean(page.title);
}

function getDocumentTitle(page: PageDataLegacy['page']) {
  const frontmatter = page.frontmatter || {};
  const localeInfo =
    siteData.themeConfig.locales?.find(locale => locale.lang === page.lang) ??
    null;
  const mainTitle = siteData.title || localeInfo?.title || '';
  let title = (frontmatter.title as string) ?? page.title;

  if (title && (page.pageType === 'doc' || page.pageType === 'doc-wide')) {
    title = concatTitle(title, (frontmatter.titleSuffix as string) || mainTitle);
  } else if (page.pageType === 'home') {
    title = concatTitle(mainTitle, frontmatter.titleSuffix as string);
  } else if (page.pageType === '404') {
    title = concatTitle('404', mainTitle);
  } else {
    title = mainTitle;
  }

  return title || '';
}

function getDocumentDescription(page: PageDataLegacy['page']) {
  const localeInfo =
    siteData.themeConfig.locales?.find(locale => locale.lang === page.lang) ??
    null;
  return page.description || siteData.description || localeInfo?.description || '';
}

function concatTitle(title: string, suffix?: string) {
  if (!suffix) {
    return title;
  }

  const trimmedTitle = title.trim();
  const trimmedSuffix = suffix.trim();

  if (!trimmedSuffix.startsWith('-') && !trimmedSuffix.startsWith('|')) {
    return `${trimmedTitle} - ${trimmedSuffix}`;
  }

  return `${trimmedTitle} ${trimmedSuffix}`;
}

function renderHeadTags(head: UserConfig['head'], routeMeta: RouteMeta) {
  if (!head?.length) {
    return null;
  }

  return head.map((headItem, index) => {
    if (typeof headItem === 'string') {
      return (
        <meta
          key={`raw-head-${index}`}
          name={`rspress-head-${index}`}
          content={headItem}
        />
      );
    }

    if (typeof headItem === 'function') {
      const result = headItem(routeMeta);
      return renderTupleHead(result, index);
    }

    return renderTupleHead(headItem, index);
  });
}

function renderFrontmatterHead(head: unknown) {
  if (!Array.isArray(head)) {
    return null;
  }

  return head.map((item, index) => renderTupleHead(item, index, 'frontmatter'));
}

function renderTupleHead(
  item: unknown,
  index: number,
  prefix = 'config',
) {
  if (!item) {
    return null;
  }

  if (typeof item === 'string') {
    return (
      <meta
        key={`${prefix}-raw-${index}`}
        name={`${prefix}-head-${index}`}
        content={item}
      />
    );
  }

  if (!Array.isArray(item) || typeof item[0] !== 'string') {
    return null;
  }

  return React.createElement(item[0], {
    key: `${prefix}-${item[0]}-${index}`,
    ...(item[1] || {}),
  });
}

function getRscMdxComponents() {
  return {
    h1: (props: React.ComponentProps<'h1'>) => (
      <h1 className="rp-toc-include" {...props} />
    ),
    h2: (props: React.ComponentProps<'h2'>) => (
      <h2 className="rp-toc-include" {...props} />
    ),
    h3: (props: React.ComponentProps<'h3'>) => (
      <h3 className="rp-toc-include" {...props} />
    ),
    h4: (props: React.ComponentProps<'h4'>) => (
      <h4 className="rp-toc-include" {...props} />
    ),
    h5: (props: React.ComponentProps<'h5'>) => (
      <h5 className="rp-toc-include" {...props} />
    ),
    h6: (props: React.ComponentProps<'h6'>) => (
      <h6 className="rp-toc-include" {...props} />
    ),
    a: (props: React.ComponentProps<'a'>) => {
      const href = props.href ?? '#';
      return <a {...props} className="rp-link" href={href} />;
    },
    img: (props: React.ComponentProps<'img'>) => {
      const src = props.src ? normalizeImagePath(props.src) : props.src;
      return <img {...props} src={src} />;
    },
  };
}

function RscCallout({
  type,
  title,
  children,
}: {
  type: string;
  title?: string;
  children: React.ReactNode;
}) {
  const heading = title ?? capitalize(type);

  if (type === 'details') {
    return (
      <details className={`rp-callout rp-callout--${type}`}>
        <summary className="rp-callout__title">{heading}</summary>
        <div className="rp-callout__content">{children}</div>
      </details>
    );
  }

  return (
    <div className={`rp-callout rp-callout--${type}`}>
      <div className="rp-callout__title">{heading}</div>
      <div className="rp-callout__content">{children}</div>
    </div>
  );
}

function capitalize(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function RscHomeLayout({
  frontmatter,
}: {
  frontmatter: PageDataLegacy['page']['frontmatter'];
}) {
  const hero = frontmatter.hero as
    | {
        name?: string;
        text?: string;
        tagline?: string;
        actions?: { text: string; link: string }[];
      }
    | undefined;
  const features = (frontmatter.features as
    | { title: string; details: string; link?: string }[]
    | undefined) ?? [];
  const footerMessage = siteData.themeConfig.footer?.message;

  return (
    <>
      <div className="rp-home-hero rp-home-hero--no-image">
        <div className="rp-home-hero__container">
          {hero?.name ? (
            <div className="rp-home-hero__content">
              <div className="rp-home-hero__title">
                <span className="rp-home-hero__title-brand">{hero.name}</span>
              </div>
            </div>
          ) : null}
          {hero?.text ? (
            <div className="rp-home-hero__subtitle">{hero.text}</div>
          ) : null}
          {hero?.tagline ? (
            <p className="rp-home-hero__tagline">{hero.tagline}</p>
          ) : null}
          {hero?.actions?.length ? (
            <div className="rp-home-hero__actions">
              {hero.actions.map(action => (
                <a
                  key={action.link}
                  className="rp-button rp-button--brand rp-button--big rp-home-hero__action"
                  href={action.link}
                >
                  {action.text}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {features.length ? (
        <div className="rp-home-feature">
          {features.map(feature => (
            <div
              key={feature.title}
              className="rp-home-feature__item rp-home-feature__item--span-4"
            >
              <div className="rp-home-feature__item-wrapper">
                <article className="rp-home-feature__card">
                  <div className="rp-home-feature__title-wrapper">
                    <h2 className="rp-home-feature__title">{feature.title}</h2>
                  </div>
                  <p className="rp-home-feature__detail">{feature.details}</p>
                  {feature.link ? (
                    <a className="rp-link" href={feature.link}>
                      {feature.link}
                    </a>
                  ) : null}
                </article>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {footerMessage ? (
        <footer className="rp-home-footer">
          <div className="rp-home-footer__container">
            <div
              className="rp-home-footer__message"
              dangerouslySetInnerHTML={{
                __html: String(footerMessage),
              }}
            />
          </div>
        </footer>
      ) : null}
    </>
  );
}
