// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import htmr from 'htmr';
import { parseDocument } from 'htmlparser2';
import { isEqualPath } from '@rspress/runtime';
import { isNumber } from 'lodash-es';

export function isActive(
  currentPath: string,
  targetLink?: string,
  strict = false,
) {
  if (!targetLink) {
    return false;
  }
  if (strict) {
    return isEqualPath(currentPath, targetLink);
  }

  return (
    isEqualPath(currentPath, targetLink) || currentPath.startsWith(targetLink)
  );
}

export function isMobileDevice() {
  return window.innerWidth <= 1024;
}

export function renderHtmlOrText(str?: string | number | null) {
  if (!str) {
    return '';
  }

  if (isNumber(str)) {
    return str;
  }

  // Parse the HTML to check for validity
  const hasValidHtmlElements = parseDocument(str).children.some(
    node => node.type === 'tag' && node.children.length > 0,
  );

  if (hasValidHtmlElements) {
    return htmr(str);
  }

  return str
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// This doesn’t handle all nested complexities
// but it’s sufficient for most common Markdown usage scenarios
// while maintaining compatibility with all browsers (including Safari).
// For some complex cases, more complex parsing logic or the use of a specialized Markdown AST parsing library may be required.
const CODE_TEXT_PATTERN = /`(.*?)`/g;
const STRONG_TEXT_PATTERN = /\*{2}(?!\*)(.*?)\*{2}(?!\*)/g;
const EMPHASIS_TEXT_PATTERN = /\*(?!\*)(.*?)\*(?!\*)/g;
const DELETE_TEXT_PATTERN = /\~{2}(.*?)\~{2}/g;

/**
 * In this method, we will render the markdown text to inline html and support basic markdown syntax, including the following:
 * - bold
 * - emphasis
 * - inline code
 * @param text The markdown text to render.
 */
export function renderInlineMarkdown(text: string) {
  const htmlText = text
    // replace `<list>` to prevent disappearing in dom, but not replace \<number\>
    .replace(/`[^`]+`/g, match => match.replace(/</g, '&lt;'))
    .replace(STRONG_TEXT_PATTERN, '<strong>$1</strong>')
    .replace(EMPHASIS_TEXT_PATTERN, '<em>$1</em>')
    .replace(DELETE_TEXT_PATTERN, '<del>$1</del>')
    .replace(CODE_TEXT_PATTERN, '<code>$1</code>');

  return renderHtmlOrText(htmlText);
}

export function parseInlineMarkdownText(mdx: string) {
  return mdx
    .replace(STRONG_TEXT_PATTERN, '$1')
    .replace(EMPHASIS_TEXT_PATTERN, '$1')
    .replace(DELETE_TEXT_PATTERN, '$1')
    .replace(CODE_TEXT_PATTERN, '$1');
}
