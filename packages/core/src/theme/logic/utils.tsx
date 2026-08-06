export function renderHtmlOrText(
  str?: string | number | null,
):
  | { children: string | null }
  | { dangerouslySetInnerHTML: { __html: string } } {
  if (!str) {
    return { children: null };
  }

  if (typeof str === 'number') {
    return { children: str.toString() };
  }

  // Parse the HTML to check for validity
  // Regular Expression: match basic HTML tags, including self-closing tags.
  // <([a-z]+): Matches the opening tag and captures the tag name.
  // ([^<]*): Matches any attributes within the tag.
  // (?:>(.*?)<\/\1>|\s*\/>): Matches either a closing tag with content or a self-closing tag.
  // i Flag: Makes the regex case-insensitive, allowing it to match tags like <IMG> as well as <img>.
  const hasValidHtmlElements = /<([a-z]+)([^<]*)(?:>(.*?)<\/\1>|\s*\/>)/i.test(
    str,
  );

  const hasValidHtmlEntities = /&(?:[a-z][0-9a-z]*|#(?:\d+|x[0-9a-f]+));/i.test(
    str,
  );

  if (hasValidHtmlElements || hasValidHtmlEntities) {
    return { dangerouslySetInnerHTML: { __html: str } };
  }

  return {
    children: str
      .replace(/\\</g, '<')
      .replace(/\\>/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>'),
  };
}

// This doesn’t handle all nested complexities
// but it’s sufficient for most common Markdown usage scenarios
// while maintaining compatibility with all browsers (including Safari).
// For some complex cases, more complex parsing logic or the use of a specialized Markdown AST parsing library may be required.
const CODE_TEXT_PATTERN = /`(.*?)`/g;
const STRONG_TEXT_PATTERN = /\*{2}(?!\*)(.*?)\*{2}(?!\*)/g;
const EMPHASIS_TEXT_PATTERN = /\*(?!\*)(.*?)\*(?!\*)/g;
const DELETE_TEXT_PATTERN = /~{2}(.*?)~{2}/g;
const INLINE_CODE_PATTERN = /`[^`]+`/g;
// <\/?[a-z]: Matches an opening or a closing tag, a tag name always starts with a letter.
// [^>]*: Matches the rest of the tag, including its attributes.
const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;
// Matches named entities like `&amp;` as well as numeric ones like `&#39;` and `&#x27;`.
const HTML_ENTITY_PATTERN = /&(#\d+|#x[0-9a-f]+|[a-z][0-9a-z]*);/gi;

// The entities which can be produced by `Element.innerHTML`, plus the most common ones.
const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00A0',
  quot: '"',
};

// The entities are decoded in a single pass, so an already escaped entity like `&amp;lt;` is decoded to `&lt;` instead
// of `<`.
function decodeHtmlEntities(text: string) {
  return text.replace(HTML_ENTITY_PATTERN, (match, entity: string) => {
    if (!entity.startsWith('#')) {
      return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
    }
    const isHex = entity[1] === 'x' || entity[1] === 'X';
    const codePoint = Number.parseInt(
      isHex ? entity.slice(2) : entity.slice(1),
      isHex ? 16 : 10,
    );
    // `String.fromCodePoint` throws for code points outside of the Unicode range.
    return codePoint > 0x10ffff ? match : String.fromCodePoint(codePoint);
  });
}

/**
 * In this method, we will render the markdown text to inline html and support basic markdown syntax, including the following:
 * - bold
 * - emphasis
 * - delete
 * - inline code
 * @param text The markdown text to render.
 * @internal
 * @private
 */
export function renderInlineMarkdown(text: string) {
  const htmlText = text
    // replace `<list>` to prevent disappearing in dom, but not replace \<number\>
    .replace(INLINE_CODE_PATTERN, match => match.replace(/</g, '&lt;'))
    .replace(STRONG_TEXT_PATTERN, '<strong>$1</strong>')
    .replace(EMPHASIS_TEXT_PATTERN, '<em>$1</em>')
    .replace(DELETE_TEXT_PATTERN, '<del>$1</del>')
    .replace(CODE_TEXT_PATTERN, '<code>$1</code>');

  return renderHtmlOrText(htmlText);
}

/**
 * Parse a header text to plain text, which can be used in attributes like `title`. Both the inline markdown syntax and
 * the HTML are stripped, because a header is markdown when it comes from the remark toc plugin, and HTML when it is
 * collected from the DOM by `useDynamicToc`, carrying the markup of the components rendered in the heading.
 * @param mdx The header text to parse, either markdown or HTML.
 * @internal
 * @private
 */
export function parseInlineMarkdownText(mdx: string) {
  const plainText = mdx
    // escape `<list>` in inline code, so that it is not stripped as an HTML tag
    .replace(INLINE_CODE_PATTERN, match => match.replace(/</g, '&lt;'))
    .replace(STRONG_TEXT_PATTERN, '$1')
    .replace(EMPHASIS_TEXT_PATTERN, '$1')
    .replace(DELETE_TEXT_PATTERN, '$1')
    .replace(CODE_TEXT_PATTERN, '$1')
    .replace(HTML_TAG_PATTERN, '');

  return decodeHtmlEntities(plainText).trim();
}
