// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import htmr from 'htmr';
import isHtml from 'is-html';
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
  } else {
    return (
      isEqualPath(currentPath, targetLink) || currentPath.startsWith(targetLink)
    );
  }
}

export function getLogoUrl(
  rawLogo: string | { dark: string; light: string },
  theme: 'dark' | 'light',
) {
  // If logo is a string, use it directly
  if (typeof rawLogo === 'string') {
    return rawLogo;
  }
  // If logo is an object, use dark/light mode logo
  return theme === 'dark' ? rawLogo.dark : rawLogo.light;
}

export function isMobileDevice() {
  return window.innerWidth < 768;
}

export function renderHtmlOrText(str?: string | number | null) {
  if (!str) {
    return '';
  }
  if (isNumber(str)) {
    return str;
  }

  return isHtml(str) ? htmr(str) : str;
}

/**
 * In this method, we will render the markdown text to inline html and support basic markdown syntax, including the following:
 * - bold
 * - inline code
 * @param text The markdown text to render.
 */
export function renderInlineMarkdown(text: string) {
  const htmlText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
  return renderHtmlOrText(htmlText);
}
