import type { PageDataLegacy } from '@rspress/shared';
import { createContext, useContext } from 'react';

interface IPageContext {
  data: PageDataLegacy['page'];
  setData?: (data: PageDataLegacy['page']) => void;
}

export const PageContext = createContext<IPageContext>({} as IPageContext);

export function usePage(): { page: PageDataLegacy['page'] } {
  const ctx = useContext(PageContext);
  return {
    page: ctx.data,
  };
}
