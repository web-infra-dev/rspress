import type { PageDataLegacy } from '@rspress/shared';
import { createContext } from 'react';
import { useLoaderData } from 'react-router-dom';

interface IPageContext {
  data: PageDataLegacy['page'];
  setData?: (data: PageDataLegacy['page']) => void;
}

export const PageContext = createContext<IPageContext>({} as IPageContext);

export function usePage(): { page: PageDataLegacy['page'] } {
  const data = useLoaderData();
  console.log(data, 22222222);
  return {
    page: data as PageDataLegacy['page'],
  };
}
