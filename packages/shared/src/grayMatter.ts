import matter from 'gray-matter';

export interface GrayMatterResult<
  TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
> {
  content: string;
  data: TFrontmatter;
}

export function grayMatter<
  TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
>(source: string): GrayMatterResult<TFrontmatter> {
  const { content, data } = matter(source);

  return {
    content,
    data: data as TFrontmatter,
  };
}

export default grayMatter;
