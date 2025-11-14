import { useLocation } from '@rspress/core/runtime';
import { useEffect } from 'react';

/**
 * Parse CSS length value to number (in pixels)
 * Supports: px
 */
function parseCSSLength(value: string): number {
  if (!value || value === 'auto' || value === 'none') {
    return 0;
  }

  const numValue = Number.parseFloat(value);
  if (Number.isNaN(numValue)) {
    return 0;
  }

  // For px or plain number, just return the numeric value
  return numValue;
}

function getTargetTop(element: HTMLElement) {
  // get scroll-padding-top from html
  const scrollPaddingTop = parseCSSLength(
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('scroll-padding-top'),
  );

  const targetTop =
    window.scrollY + element.getBoundingClientRect().top - scrollPaddingTop;

  return Math.round(targetTop);
}

function scrollToTarget(target: HTMLElement) {
  const offsetTop = getTargetTop(target);

  window.scrollTo({
    left: 0,
    top: offsetTop,
  });
}

export function useSetup() {
  const { pathname } = useLocation();

  useEffect(() => {
    const decodedHash = decodeURIComponent(window.location.hash);
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target);
      }
    }
  }, [pathname]);
  return;
}
