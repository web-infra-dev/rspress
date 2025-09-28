import { useEffect } from 'react';

function useClickOutside(
  ref:
    | React.RefObject<HTMLElement | null>
    | React.RefObject<HTMLElement | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];

      for (const r of refs) {
        const { current: el } = r;
        if (el && el.contains(event.target as Node)) {
          return;
        }
      }
      handler(event);
      return;
    };
    document.addEventListener('click', listener);
    return () => {
      document.removeEventListener('click', listener);
    };
  }, [ref, handler]);
}

export { useClickOutside };
