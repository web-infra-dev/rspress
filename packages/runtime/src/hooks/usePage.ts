import type { PageDataLegacy } from '@rspress/shared';
import { createContext, useContext } from 'react';

export const PageContext = createContext({} as PageDataLegacy['page']);

export function usePage(): { page: PageDataLegacy['page'] } {
  const ctx = useContext(PageContext);
  return {
    page: ctx,
  };
}
