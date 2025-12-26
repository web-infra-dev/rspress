import type { FrontMatterMeta } from '@rspress/shared';
import { usePage } from './usePage';

export const useFrontmatter = (): { frontmatter: FrontMatterMeta } => {
  const { page } = usePage();
  const { frontmatter = {} } = page;
  return { frontmatter };
};
