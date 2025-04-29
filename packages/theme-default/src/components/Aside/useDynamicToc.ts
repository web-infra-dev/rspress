import type { Header } from '@rspress/shared';
import { useEffect, useState } from 'react';

export const useDynamicToc = () => {
  // const headers: Header[] = [] satisfies Header[];
  // const headerIds: string[] = [];
  const [headers, setHeaders] = useState<Header[]>([]);

  // use the same data between Aside and Toc, and use publisher and subscriber to avoid useContext
  const target = document.querySelector('.rspress-doc');
  useEffect(() => {
    let observer: null | MutationObserver = null;
    function updateHeaders() {
      const collectedHeaders: Header[] = [];
      const collectedHeaderIds: string[] = [];
      const elements = target?.querySelectorAll(
        '.rspress-doc h2.rspress-doc-outline, h3.rspress-doc-outline, h4.rspress-doc-outline',
      );
      elements?.forEach(el => {
        if (el) {
          const ele = el.querySelector('.header-anchor');
          ele && el.removeChild(ele);
          collectedHeaders.push({
            id: el.id,
            text: el.innerHTML,
            depth: Number.parseInt(el.tagName[1]),
            charIndex: 0,
          });
          collectedHeaderIds.push(el.id);
          ele && el.appendChild(ele);
        }
      });

      setHeaders(collectedHeaders);
    }

    if (target) {
      updateHeaders();
    }

    const observerHasNotBeenCreated = !observer;

    if (target && observerHasNotBeenCreated) {
      observer = new MutationObserver(mutationList => {
        let needUpdate: boolean = false;
        for (const mutation of mutationList) {
          mutation.addedNodes.forEach(node => {
            if (
              'tagName' in node &&
              ['H2', 'H3', 'H4'].includes((node as HTMLHeadingElement)?.tagName)
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
              ['H2', 'H3', 'H4'].includes((node as HTMLHeadingElement)?.tagName)
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
        needUpdate && updateHeaders();
      });
      observer.observe(target, { childList: true, subtree: true });
    }

    return () => {
      if (target && observerHasNotBeenCreated) {
        observer?.disconnect();
        observer = null;
      }
    };
  }, [target]);

  return headers;
};
