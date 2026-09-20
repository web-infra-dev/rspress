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
const STRONG_TEXT_PATTERN = /\*{2}(?!\*)(.*?)\*{2}(?!\*)/g;
const EMPHASIS_TEXT_PATTERN = /\*(?!\*)(.*?)\*(?!\*)/g;
const DELETE_TEXT_PATTERN = /~{2}(.*?)~{2}/g;
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
    // Keep the entity as written when it does not denote a standalone character: outside of the Unicode range, which
    // makes `String.fromCodePoint` throw, or a lone surrogate, which would leave the result ill-formed and break
    // consumers like `encodeURIComponent`. A `NaN` code point fails both comparisons and is kept as well.
    const isScalarValue =
      codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
    return isScalarValue ? String.fromCodePoint(codePoint) : match;
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Keep literal fragments out of the formatting and HTML detection passes. The
// marker does not occur in the input, so user text cannot
// accidentally refer to a protected fragment.
function protectInlineMarkdown(text: string) {
  let marker = '\u0000';
  while (text.includes(marker)) {
    marker += '\u0000';
  }
  const fragments: { text: string; html: string }[] = [];
  const protect = (value: string, html = escapeHtml(value)) => {
    const index = fragments.push({ text: value, html }) - 1;
    return `${marker}${index}${marker}`;
  };

  // Backslash escapes apply to ASCII punctuation outside code spans. Code
  // spans close on a backtick run of exactly the same length as their opener.
  const pattern =
    /\\([!-/:-@[-`{-~])|`+|<code\b[^>]*>[\s\S]*?<\/code>|&(#\d+|#x[0-9a-f]+|[a-z][0-9a-z]*);/gi;
  const backticks = /`+/g;
  let result = '';
  let offset = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    result += text.slice(offset, match.index);
    if (match[1]) {
      result += protect(match[1]);
    } else if (match[0].startsWith('&')) {
      // An entity must not make surrounding generic type text become HTML.
      result += protect(decodeHtmlEntities(match[0]), match[0]);
    } else if (match[0].startsWith('<')) {
      // Dynamic TOC entries can already contain code rendered by React.
      result += protect(
        decodeHtmlEntities(match[0].replace(HTML_TAG_PATTERN, '')),
        match[0],
      );
    } else {
      backticks.lastIndex = pattern.lastIndex;
      let closing: RegExpExecArray | null;
      while ((closing = backticks.exec(text))) {
        if (closing[0].length === match[0].length) break;
      }
      if (closing) {
        let value = text
          .slice(pattern.lastIndex, closing.index)
          .replace(/\r\n?|\n/g, ' ');
        if (
          value.startsWith(' ') &&
          value.endsWith(' ') &&
          /[^ ]/.test(value)
        ) {
          value = value.slice(1, -1);
        }
        result += protect(value, `<code>${escapeHtml(value)}</code>`);
        pattern.lastIndex = closing.index + closing[0].length;
      } else {
        result += protect(match[0]);
      }
    }
    offset = pattern.lastIndex;
  }
  result += text.slice(offset);

  return {
    text: result,
    restore: (value: string, format: 'text' | 'html') =>
      value.replace(
        new RegExp(`${marker}(\\d+)${marker}`, 'g'),
        (_, index: string) => fragments[Number(index)][format],
      ),
  };
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
  const protectedText = protectInlineMarkdown(text);
  // Decide whether the source is HTML before generated tags or escaped
  // characters can change that decision. Plain text is escaped as a whole.
  const source = renderHtmlOrText(protectedText.text);
  const htmlText = (
    'children' in source
      ? escapeHtml(source.children ?? '')
      : source.dangerouslySetInnerHTML.__html
  )
    .replace(STRONG_TEXT_PATTERN, '<strong>$1</strong>')
    .replace(EMPHASIS_TEXT_PATTERN, '<em>$1</em>')
    .replace(DELETE_TEXT_PATTERN, '<del>$1</del>');

  return {
    dangerouslySetInnerHTML: {
      __html: protectedText.restore(htmlText, 'html'),
    },
  };
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
  const protectedText = protectInlineMarkdown(mdx);
  const source = renderHtmlOrText(protectedText.text);
  const plainText = (
    'children' in source
      ? (source.children ?? '')
      : source.dangerouslySetInnerHTML.__html.replace(HTML_TAG_PATTERN, '')
  )
    .replace(STRONG_TEXT_PATTERN, '$1')
    .replace(EMPHASIS_TEXT_PATTERN, '$1')
    .replace(DELETE_TEXT_PATTERN, '$1');

  return protectedText.restore(decodeHtmlEntities(plainText), 'text').trim();
}
