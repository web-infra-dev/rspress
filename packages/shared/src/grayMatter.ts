import matter from 'gray-matter';

// Use a subset of gray-matter's return type to avoid api-extractor issues with its dts
export interface GrayMatterResult<
  TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
> {
  content: string;
  data: TFrontmatter;
  excerpt?: string;
  orig: Buffer | string;
  language: string;
  matter: string;
}

export function grayMatter<
  TFrontmatter extends Record<string, unknown> = Record<string, unknown>,
>(
  source: string | Buffer,
  options?: any,
): GrayMatterResult<TFrontmatter> {
  const result = matter(source, options);
  return result as unknown as GrayMatterResult<TFrontmatter>;
}

export default grayMatter;
