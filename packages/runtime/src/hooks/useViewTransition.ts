import { type ReactNode, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export function useViewTransition(dom: ReactNode) {
  /**
   * use a pseudo element to hold the actual JSX element so we can schedule the
   * update later in sync
   */
  const [element, setElement] = useState(dom);

  useLayoutEffect(() => {
    if (document.startViewTransition && element !== dom) {
      /**
       * the browser will take a screenshot here
       */
      document.startViewTransition(() => {
        /**
         * react will batch all the updates in callback and flush it sync
         */
        flushSync(() => {
          setElement(dom);
        });
        /**
         * react flushed the dom to browser
         * and the browser will start the animation
         */
        /**
         * dispatchEvent for several logic
         */
        window.dispatchEvent(new Event('RspressReloadContent'));
      });
    } else {
      flushSync(() => {
        setElement(dom);
      });
      /**
       * dispatchEvent for several logic
       */
      window.dispatchEvent(new Event('RspressReloadContent'));
    }
  }, [dom]);
  /**
   * take this element to the actual V-DOM tree
   */
  return element;
}
