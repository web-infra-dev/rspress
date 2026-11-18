import './index.scss';
import type { SidebarData } from '@rspress/core';
import {
  useActiveMatcher,
  useLang,
  usePage,
  useSidebar,
} from '@rspress/core/runtime';
import {
  Layout as OriginalLayout,
  type LayoutProps,
  Link,
  renderInlineMarkdown,
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
