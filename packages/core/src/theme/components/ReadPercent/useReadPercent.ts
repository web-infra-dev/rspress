import { useWindowSize } from '@rspress/core/runtime';
import { useEffect, useMemo, useState } from 'react';

export const useReadPercent = () => {
  const [scrollTop, setScrollTop] = useState(0);
  const [h, setH] = useState(0);
  const { height } = useWindowSize();

  useEffect(() => {
    const scrollElement = window || document.documentElement;
    const handler = () => {
      const dom = document.querySelector('.rspress-doc');
      if (dom) {
        const a = dom.getBoundingClientRect();
        setH(a.height || 0);
      }
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setScrollTop(scrollTop);
    };
    handler();
    scrollElement?.addEventListener('scroll', handler);
    return () => {
      scrollElement?.removeEventListener('scroll', handler);
    };
  }, []);

  const readPercent = useMemo(() => {
    const deltaHeight = Math.min(scrollTop, height);
    return (
      Math.floor(
        Math.min(Math.max(0, ((scrollTop - 50 + deltaHeight) / h) * 100), 100),
      ) || 0
    );
  }, [scrollTop, height]);

  return [readPercent, scrollTop];
};
