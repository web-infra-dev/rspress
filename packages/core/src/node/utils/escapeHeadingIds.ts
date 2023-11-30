/**
 * Support custom id like `#hello world {#custom-id}`
 * Avoid https://mdxjs.com/docs/troubleshooting-mdx/#could-not-parse-expression-with-acorn-error
 */
export function escapeMarkdownHeadingIds(content: string): string {
  const markdownHeadingRegexp = /(?:^|\n)#{1,6}(?!#).*/g;
  return content.replace(markdownHeadingRegexp, substring =>
    substring
      .replace('{#', '\\{#')
      // prevent duplicate escaping
      .replace('\\\\{#', '\\{#'),
  );
}
