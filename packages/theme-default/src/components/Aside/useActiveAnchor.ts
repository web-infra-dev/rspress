import type { Header } from '@rspress/shared';
import { useEffect, useMemo, useRef, useState } from 'react';

const useVisibleAnchors = (headers: Header[]): string[] => {
  const [visibleAnchors, setVisibleAnchors] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const offsets = headers.map(header => {
        const el = document.getElementById(header.id);
        if (!el) return { id: header.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: header.id, top: rect.top };
      });

      const visible = offsets
        .filter(offset => offset.top >= 64 && offset.top < window.innerHeight)
        .map(offset => offset.id);

      setVisibleAnchors(visible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headers]);

  return visibleAnchors;
};

export const useActiveAnchor = (headers: Header[], isBottom: boolean) => {
  const anchors = useVisibleAnchors(headers);

  const anchorDirty = useRef<string>(null);

  const activeAnchor = useMemo(() => {
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

  anchorDirty.current = activeAnchor;

  return activeAnchor;
};
