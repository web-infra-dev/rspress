import { useLocation } from '@rspress/runtime';
import type { Header } from '@rspress/shared';
import { useEffect, useState } from 'react';

export const useActiveAnchor = (headers: Header[]) => {
  const [activeAnchorId, setActiveAnchorId] = useState<string | undefined>();
  const [scrolledHeader, setScrolledHeader] = useState<Header | undefined>();
  const { hash } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // get var(--rp-nav-height)
      const navHeight = Number(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--rp-nav-height')
          .replace(/(px|em|rem)$/, ''),
      );
      // get ver(--rp-sidebar-menu-height)
      const sidebarMenuHeight = Number(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--rp-sidebar-menu-height')
          .replace(/(px|em|rem)$/, ''),
      );

      const topOffset = navHeight + sidebarMenuHeight - 5; // 5 is the tolerance

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
