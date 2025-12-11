import { useLayoutEffect, useState } from 'react';

// Type shim for window.__EDEN_PAGE_DATA__
declare global {
  interface Window {
    __MODERN_PAGE_DATA__: any;
  }
}

const RESIZE_DEBOUNCE_MS = 150;

export function useWindowSize(initialWidth?: number, initialHeight?: number) {
  const [size, setSize] = useState({
    width: initialWidth ?? Number.POSITIVE_INFINITY,
    height: initialHeight ?? Number.POSITIVE_INFINITY,
  });

  useLayoutEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, RESIZE_DEBOUNCE_MS);
    };

    // first initialization
    setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
