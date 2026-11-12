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

export function RuixenBreadcrumb() {
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

function ContributionIcon({ kind }: { kind: 'issue' | 'feature' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'issue' ? (
        <>
          <rect x="7" y="7" width="10" height="13" rx="5" />
          <path d="m9 3 2 4m4-4-2 4M3 9h4m10 0h4M3 15h4m10 0h4M4 21l4-3m12 3-4-3M12 7v13" />
        </>
      ) : (
        <>
          <path d="M9 18h6m-5 3h4M8.5 14a6 6 0 1 1 7 0c-.9.7-1.5 1.7-1.5 3h-4c0-1.3-.6-2.3-1.5-3Z" />
        </>
      )}
    </svg>
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
  const repository = site.themeConfig.editLink?.docRepoBaseUrl?.match(
    /https:\/\/github\.com\/[^/]+\/[^/]+/,
  )?.[0];

  return (
    <div className="rp-outline">
      <div className="rp-outline__title">
        {isZh ? '本页内容' : 'On This Page'}
      </div>
      <nav className="rp-outline__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-outline__bottom">
        <div className="rp-preset-contribute-title">
          {isZh ? '参与贡献' : 'Contribute'}
        </div>
        {repository ? (
          <>
            <a
              className="rp-outline__action-row"
              href={`${repository}/issues/new`}
              target="_blank"
              rel="noreferrer"
            >
              <ContributionIcon kind="issue" />
              {isZh ? '报告问题' : 'Report an issue'}
            </a>
            <a
              className="rp-outline__action-row"
              href={`${repository}/issues/new`}
              target="_blank"
              rel="noreferrer"
            >
              <ContributionIcon kind="feature" />
              {isZh ? '建议功能' : 'Request a feature'}
            </a>
          </>
        ) : null}
        <EditLink isOutline />
        {site.themeConfig.enableScrollToTop !== false && <BackToTop />}
      </div>
    </div>
  );
}

export function Layout() {
  return <OriginalLayout beforeDocContent={<RuixenBreadcrumb />} />;
}
