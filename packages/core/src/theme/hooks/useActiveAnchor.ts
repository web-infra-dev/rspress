import type { Header } from '@rspress/core';
import { useLocation } from '@rspress/core/runtime';
import { useEffect, useState } from 'react';

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

/**
 * @internal
 */
export const useActiveAnchor = (headers: Header[]) => {
  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>();
  const [scrolledHeader, setScrolledHeader] = useState<Header | undefined>();
  const { hash } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleScroll = () => {
      // Reuse scroll-padding-top from CSS
      // This value is already calculated as:
      // calc(var(--rp-banner-height, 0px) + var(--rp-nav-height) + var(--rp-sidebar-menu-height))
      const scrollPaddingTop = parseCSSLength(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('scroll-padding-top'),
      );
      const topOffset = scrollPaddingTop - 5; // 5 is the tolerance

      const offsets = headers.map(header => {
        const el = document.getElementById(header.id);
        if (!el) return { id: header.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: header.id, top: rect.top };
      });

      const scrolledIds = offsets
        .filter(offset => offset.top < topOffset)
        .map(offset => offset.id);

      const visibleIds = offsets
        .filter(
          offset => offset.top >= topOffset && offset.top <= window.innerHeight,
        )
        .map(offset => offset.id);

      const scrolledHeaderId = scrolledIds[scrolledIds.length - 1];

      const scrolledHeader = headers.find(
        header => header.id === scrolledHeaderId,
      );

      if (visibleIds.length === 0) {
        setActiveAnchorId(scrolledHeaderId);
      } else {
        setActiveAnchorId(visibleIds[0]);
      }
      setScrolledHeader(scrolledHeader);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headers, hash]);

  return {
    scrolledHeader,
    activeAnchorId,
  };
};
