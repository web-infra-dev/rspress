import { useLocation } from '@rspress/runtime';
import type { Header } from '@rspress/shared';
import { useEffect, useState } from 'react';

function defaultZeroComputedStyle(s: string) {
  const n = Number(s.replace(/(px|em|rem)$/, ''));
  if (Number.isNaN(n)) {
    return 0;
  }
  return n;
}

export const useActiveAnchor = (headers: Header[]) => {
  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>();
  const [scrolledHeader, setScrolledHeader] = useState<Header | undefined>();
  const { hash } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleScroll = () => {
      // get var(--rp-banner-height)
      const bannerHeight = defaultZeroComputedStyle(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('--rp-banner-height'),
      );
      // get var(--rp-nav-height)
      const navHeight = defaultZeroComputedStyle(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('--rp-nav-height'),
      );
      // get ver(--rp-sidebar-menu-height)
      const sidebarMenuHeight = defaultZeroComputedStyle(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('--rp-sidebar-menu-height'),
      );

      const topOffset = bannerHeight + navHeight + sidebarMenuHeight - 5; // 5 is the tolerance

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
