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
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    // first initialization
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
