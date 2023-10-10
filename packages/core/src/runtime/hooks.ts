import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { PageData } from '@rspress/shared';
import i18nTextData from 'virtual-i18n-text';
import { flushSync } from 'react-dom';

// Type shim for window.__EDEN_PAGE_DATA__
declare global {
  interface Window {
    __MODERN_PAGE_DATA__: any;
  }
}
interface IDataContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

interface IThemeContext {
  theme: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export const DataContext = createContext({} as IDataContext);

export const ThemeContext = createContext({} as IThemeContext);

export function usePageData() {
  const ctx = useContext(DataContext);
  return ctx.data;
}

export function useLang(): string {
  const ctx = useContext(DataContext);
  return ctx.data.page.lang || '';
}

export function useVersion(): string {
  const ctx = useContext(DataContext);
  return ctx.data.page.version || '';
}

export function useDark() {
  const ctx = useContext(ThemeContext);
  return ctx.theme === 'dark';
}

export function useI18n<T = Record<string, Record<string, string>>>() {
  const lang = useLang();

  return (key: keyof T) => i18nTextData[key][lang];
}

declare global {
  interface Document {
    startViewTransition: (callback: () => void) => void;
  }
}

/**
 * There is a pitfall.
 * I was working on the navigation between pages with hash. eg. from `guide/start` -> `config/repress#nav`
 *    I need a time to dispatch an event so that the sideEffect.ts would know that
 *    the dom is attached to the browser. Otherwise the scroll position and the
 *    animation would be incorrect. You can search for `RspressReloadContent` in this codebase
 *    to findout the logic that are consuming the event.
 * The reason I didn't write it here is that I hope the logic of handling scroll and position
 *    could be in one place so that people wouldn't be confused.
 */
export function useViewTransition(dom) {
  /**
   * use a pesudo element to hold the actual JSX element so we can schedule the
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
   * take this element to the actual VDOM tree
   */
  return element;
}
