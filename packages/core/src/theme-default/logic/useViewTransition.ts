import { flushSync } from 'react-dom';
import { useLayoutEffect, useState } from 'react';

declare global {
  interface Document {
    startViewTransition: (callback: () => void) => void;
  }
}

export function useViewTransition(dom) {
  const [element, setElement] = useState(dom);
  useLayoutEffect(() => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          setElement(dom);
        });
      });
    } else {
      setElement(dom);
    }
  }, [dom]);
  return element;
}
