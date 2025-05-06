import type { Header } from '@rspress/shared';
import { useCallback, useEffect, useState } from 'react';

const updateFns: Record<string, () => void> = {};
const useForceUpdate = () => {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
};
const distributeUpdate = () => {
  for (const fn of Object.values(updateFns)) {
    fn();
  }
};

// use the same data between Aside(desktop) and Toc(mobile), and use publisher and subscriber to avoid useContext
const useSubScribe = () => {
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    const id = Math.random().toString(36).slice(2);
    updateFns[id] = forceUpdate;
    return () => {
      delete updateFns[id];
    };
  }, [forceUpdate]);
};

const headers: Header[] = [] satisfies Header[];

function isElementOnlyVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.opacity !== '0' &&
    style.visibility !== 'hidden'
  );
}

/**
 * edge case: for users who use `display: none` to hide the element
 */
function isElementVisible(element: Element): boolean {
  let currentElement: Element | null = element;
  const rootElement = document.querySelector('.rspress-doc');
  while (currentElement) {
    if (isElementOnlyVisible(currentElement)) {
      currentElement = currentElement.parentElement;
      if (currentElement === rootElement) {
        return true;
      }
    } else {
      return false;
    }
  }
  return true;
}

export const useDynamicToc = () => {
  useSubScribe();
  return headers;
};

function updateHeaders(target: Element) {
  const collectedHeaders: Header[] = [];
  const elements = target?.querySelectorAll(
    '.rspress-doc h2.rspress-doc-outline, h3.rspress-doc-outline, h4.rspress-doc-outline',
  );
  elements?.forEach(el => {
    if (el && isElementVisible(el)) {
      const ele = el.querySelector('.header-anchor');
      if (ele) {
        el.removeChild(ele);
        collectedHeaders.push({
          id: el.id,
          text: el.innerHTML,
          depth: Number.parseInt(el.tagName[1]),
          charIndex: 0,
        });
        const firstChild = el.firstChild;
        el.insertBefore(ele, firstChild);
      } else {
        collectedHeaders.push({
          id: el.id,
          text: el.innerHTML,
          depth: Number.parseInt(el.tagName[1]),
          charIndex: 0,
        });
      }
    }
  });

  headers.length = 0;
  headers.push(...collectedHeaders);
  distributeUpdate();
}

export const useWatchToc = () => {
  const [innerRef, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let observer: null | MutationObserver = null;

    const target = innerRef;

    if (target) {
      updateHeaders(target);
    }

    if (target && !observer) {
      observer = new MutationObserver(mutationList => {
        let needUpdate: boolean = false;
        for (const mutation of mutationList) {
          mutation.addedNodes.forEach(node => {
            if (
              'tagName' in node &&
              ['H2', 'H3', 'H4'].includes((node as HTMLHeadingElement).tagName)
            ) {
              needUpdate = true;
            }
            node.childNodes.forEach((child: any) => {
              if (
                'tagName' in child &&
                ['H2', 'H3', 'H4'].includes(child?.tagName)
              ) {
                needUpdate = true;
              }
            });
          });
          mutation.removedNodes.forEach(node => {
            if (
              'tagName' in node &&
              ['H2', 'H3', 'H4'].includes((node as HTMLHeadingElement).tagName)
            ) {
              needUpdate = true;
            }
            node.childNodes.forEach((child: any) => {
              if (
                'tagName' in child &&
                ['H2', 'H3', 'H4'].includes(child?.tagName)
              ) {
                needUpdate = true;
              }
            });
          });
        }
        needUpdate && updateHeaders(target);
      });
      observer.observe(target, { childList: true, subtree: true });
    }
    return () => {
      observer?.disconnect();
      observer = null;
    };
  }, [innerRef]);

  const ref = useCallback(
    (ref: HTMLDivElement | null) => {
      setRef(ref);
    },
    [setRef],
  );

  return ref;
};
