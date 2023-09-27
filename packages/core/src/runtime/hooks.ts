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

export function useViewTransition(dom) {
  /**
   * use a pesudo element to hold the actual JSX element so we can schedule the
   * update later in sync
   */
  const [element, setElement] = useState(dom);

  useLayoutEffect(() => {
    const oldName = element?.type?.displayName;
    const newName = dom?.type?.displayName;
    if (document.startViewTransition && oldName !== newName) {
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
      });
    } else {
      setElement(dom);
    }
  }, [dom]);
  /**
   * take this element to the actual VDOM tree
   */
  return element;
}
