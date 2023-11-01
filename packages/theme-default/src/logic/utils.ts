// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import htmr from 'htmr';
import isHtml from 'is-html';
import { isEqualPath } from '@rspress/runtime';
import { isNull, isNumber } from 'lodash-es';

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

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
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

export function renderHtmlOrText(str: string | number | null) {
  if (isNull(str) || isNumber(str)) {
    return str;
  }

  return isHtml(str) ? htmr(str) : str;
}
