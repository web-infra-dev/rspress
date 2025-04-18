import type { Header } from '@rspress/shared';
import { useEffect, useState } from 'react';

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

let observer: null | MutationObserver = null;
let headers: Header[] = [] satisfies Header[];
export const useDynamicToc = () => {
  // use the same data between Aside and Toc, and use publisher and subscriber to avoid useContext
  useSubScribe();

  useEffect(() => {
    const target = document.querySelector('.rspress-doc');
    function updateHeaders() {
      const collectedHeaders: Header[] = [];
      const elements = target?.querySelectorAll(
        '.rspress-doc h2.rspress-doc-outline, h3.rspress-doc-outline, h4.rspress-doc-outline',
      );
      elements?.forEach(el => {
        if (el.id) {
          const ele = el.querySelector('.header-anchor');
          ele && el.removeChild(ele);
          collectedHeaders.push({
            id: el.id,
            text: el.innerHTML,
            depth: Number.parseInt(el.tagName[1]),
            charIndex: 0,
          });
          ele && el.appendChild(ele);
        }
      });
      headers = collectedHeaders;
      distributeUpdate();
    }

    if (target) {
      updateHeaders();
    }

    if (target && !observer) {
      observer = new MutationObserver(mutationList => {
        let needUpdate: boolean = false;
        for (const mutation of mutationList) {
          mutation.addedNodes.forEach(_node => {
            const node = _node as HTMLTitleElement;
            if (
              'tagName' in node &&
              ['H2', 'H3', 'H4'].includes(node?.tagName)
            ) {
              needUpdate = true;
            }
          });
          mutation.removedNodes.forEach(_node => {
            const node = _node as HTMLTitleElement;
            if (
              'tagName' in node &&
              ['H2', 'H3', 'H4'].includes(node?.tagName)
            ) {
              needUpdate = true;
            }
          });
        }
        needUpdate && updateHeaders();
      });
      observer.observe(target, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      observer = null;
    };
  }, []);

  return headers;
};
