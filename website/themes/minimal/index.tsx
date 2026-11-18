import './index.scss';
import type { SidebarData } from '@rspress/core';
import {
  useActiveMatcher,
  useI18n,
  useLang,
  usePage,
  useSidebar,
  useSite,
} from '@rspress/core/runtime';
import {
  EditLink,
  IconScrollToTop,
  Layout as OriginalLayout,
  type LayoutProps,
  Link,
  renderInlineMarkdown,
  SvgWrapper,
  Toc,
  useReadPercent,
} from '@rspress/core/theme-original';
export * from '@rspress/core/theme-original';

type BreadcrumbParent = { text: string; link?: string };

function findSidebarParent(
  items: SidebarData,
  matches: (link: string) => boolean,
  parent?: BreadcrumbParent,
): BreadcrumbParent | undefined {
  let section = parent;
  for (const item of items) {
    if ('sectionHeaderText' in item) {
      section = { text: item.sectionHeaderText };
    } else if ('text' in item) {
      if ('items' in item) {
        const match = findSidebarParent(item.items, matches, {
          text: item.text,
          link: item.link,
        });
        if (match) return match;
      }
      if (item.link && matches(item.link)) return section;
    }
  }
}

function MinimalBreadcrumb() {
  const { page } = usePage();
  const isZh = useLang() === 'zh';
  const sidebar = useSidebar();
  const matches = useActiveMatcher();
  const parent = findSidebarParent(sidebar, matches);

  if (import.meta.env.SSG_MD) return null;

  return (
    <nav
      className="rp-preset-breadcrumb"
      aria-label={isZh ? '文档路径' : 'Document path'}
    >
      {parent ? (
        <>
          {parent.link && !matches(parent.link) ? (
            <Link href={parent.link} {...renderInlineMarkdown(parent.text)} />
          ) : (
            <span {...renderInlineMarkdown(parent.text)} />
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </>
      ) : null}
      <span aria-current="page">{page.title}</span>
    </nav>
  );
}

function BackToTop() {
  const t = useI18n();
  const [, scrollTop] = useReadPercent();

  if (scrollTop < 100) return null;

  return (
    <button
      type="button"
      className="rp-outline__action-row rp-scroll-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <SvgWrapper icon={IconScrollToTop} width="16" height="16" />
      <span>{t('scrollToTopText')}</span>
    </button>
  );
}

export function Outline() {
  const isZh = useLang() === 'zh';
  const { site } = useSite();

  return (
    <div className="rp-outline">
      <div className="rp-outline__title">
        {isZh ? '本页内容' : 'On This Page'}
      </div>
      <nav className="rp-outline__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-outline__bottom">
        <EditLink isOutline />
        {site.themeConfig.enableScrollToTop !== false && <BackToTop />}
      </div>
    </div>
  );
}

export function Layout(props: LayoutProps) {
  return (
    <OriginalLayout
      {...props}
      beforeDocContent={
        <>
          <MinimalBreadcrumb />
          {props.beforeDocContent}
        </>
      }
    />
  );
}
