import type { PageData } from '@rspress/shared';
import { createContext, useContext } from 'react';

interface IDataContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

export const DataContext = createContext({} as IDataContext);

// TODO: mark this as deprecated after V2 theme refactoring
/**
 * should use `usePage` and `useSite` instead
 */
export function usePageData(): PageData {
  const ctx = useContext(DataContext);
  return ctx.data;
}
