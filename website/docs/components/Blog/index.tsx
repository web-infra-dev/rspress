import { useLang, usePages } from '@rspress/core/runtime';
import { Link, renderInlineMarkdown } from '@rspress/core/theme';
import type { BlogAvatarAuthor } from '@rstack-dev/doc-ui/blog-avatar';
import { BlogBackground } from '@rstack-dev/doc-ui/blog-background';
import {
  BlogList as BaseBlogList,
  type BlogListItem,
} from '@rstack-dev/doc-ui/blog-list';

const AUTHORS = {
  sooniter: {
    name: 'Sooniter',
    title: 'Rspress maintainer',
    github: 'https://github.com/sooniter',
    avatar: 'https://github.com/sooniter.png',
    x: 'https://x.com/Soon_Iter',
  },
} satisfies Record<string, BlogAvatarAuthor>;

const DEFAULT_AUTHOR: BlogAvatarAuthor = {
  name: 'Rspress Team',
  avatar: 'https://assets.rspack.rs/rspress/rspress-logo.svg',
  github: 'https://github.com/web-infra-dev/rspress',
  x: 'https://x.com/rspack_dev',
  title: 'Rspress contributors',
};

type BlogFrontmatter = {
  description?: string;
  date?: string;
  authors?: (keyof typeof AUTHORS | BlogAvatarAuthor)[];
};

const getDateValue = (date?: BlogListItem['date']): number => {
  if (!date) {
    return 0;
  }

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const normalizeAuthors = (
  authors?: BlogFrontmatter['authors'],
): BlogAvatarAuthor[] => {
  if (!authors?.length) {
    return [DEFAULT_AUTHOR];
  }

  const normalizedAuthors = authors
    .map(author => {
      if (typeof author === 'string') {
        return AUTHORS[author];
      }

      return author;
    })
    .filter((author): author is BlogAvatarAuthor => Boolean(author));

  return normalizedAuthors.length ? normalizedAuthors : [DEFAULT_AUTHOR];
};

export const useBlogPages = (): BlogListItem[] => {
  const { pages } = usePages();
  const lang = useLang();

  return pages
    .filter(page => page.lang === lang)
    .filter(
      page =>
        page.routePath.includes('/blog/') && !page.routePath.endsWith('/blog/'),
    )
    .map(page => {
      const frontmatter = (page.frontmatter ?? {}) as BlogFrontmatter;
      const filename = page.routePath.split('/').pop();

      return {
        id: filename,
        title: page.title,
        description: frontmatter.description,
        date: frontmatter.date,
        href: page.routePath,
        authors: normalizeAuthors(frontmatter.authors),
      };
    })
    .sort((a, b) => getDateValue(b.date) - getDateValue(a.date));
};

export function BlogList() {
  const blogPages = useBlogPages();
  const lang = useLang();

  return (
    <>
      <BaseBlogList
        posts={blogPages}
        lang={lang}
        LinkComp={Link}
        renderInlineMarkdown={renderInlineMarkdown}
      />
      <BlogBackground />
    </>
  );
}
