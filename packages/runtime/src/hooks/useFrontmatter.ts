import type { FrontMatterMeta } from '@rspress/shared';
import { usePageData } from './usePageData';

export const useFrontmatter = (): { frontmatter: FrontMatterMeta } => {
  const { page } = usePageData();
  const { frontmatter = {} } = page;
  return { frontmatter };
};
