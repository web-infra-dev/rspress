import { useLayoutEffect, useState } from 'react';

// Type shim for window.__EDEN_PAGE_DATA__
declare global {
  interface Window {
    __MODERN_PAGE_DATA__: any;
  }
}

export function useWindowSize(initialWidth?: number, initialHeight?: number) {
  const [size, setSize] = useState({
    width: initialWidth ?? Number.POSITIVE_INFINITY,
    height: initialHeight ?? Number.POSITIVE_INFINITY,
  });

  useLayoutEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };

    // first initialization
    setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
