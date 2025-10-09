import { useLocation } from '@rspress/runtime';
import type { Header } from '@rspress/shared';
import { useEffect, useMemo, useRef, useState } from 'react';

const useVisibleAnchors = (headers: Header[]): string[] => {
  const [visibleAnchors, setVisibleAnchors] = useState<string[]>([]);
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

      const topOffset = navHeight + sidebarMenuHeight;

      const offsets = headers.map(header => {
        const el = document.getElementById(header.id);
        if (!el) return { id: header.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: header.id, top: rect.top };
      });

      const visibleIds = offsets
        .filter(
          offset => offset.top >= topOffset && offset.top < window.innerHeight,
        )
        .map(offset => offset.id);

      setVisibleAnchors(visibleIds);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headers, hash]);

  return visibleAnchors;
};

export const useActiveAnchor = (headers: Header[], isBottom: boolean) => {
  const anchors = useVisibleAnchors(headers);

  const anchorDirty = useRef<string>(null);

  const activeAnchorId = useMemo(() => {
    // If there are no anchors on the entire screen, use the before value.
    if (anchors.length === 0) {
      return anchorDirty.current;
    }
    const lastHeader = headers[headers.length - 1];
    if (isBottom) {
      return lastHeader.id;
    }
    return anchors[0];
  }, [headers, anchors, isBottom]);

  anchorDirty.current = activeAnchorId;

  const lastAnchor = headers[
    headers.findIndex(h => h.id === activeAnchorId) - 1
  ] as Header | undefined;

  return {
    activeAnchorId,
    lastAnchor,
  };
};
