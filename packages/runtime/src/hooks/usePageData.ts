import type { PageData } from '@rspress/shared';
import { createContext, useContext } from 'react';

interface IDataContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

export const DataContext = createContext({} as IDataContext);

export function usePageData(): PageData {
  const ctx = useContext(DataContext);
  return ctx.data;
}
