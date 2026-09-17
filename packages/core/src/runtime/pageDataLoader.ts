import type { LoaderFunctionArgs } from 'react-router-dom';
import { initPageData } from './initPageData';
import { removeBase } from './utils';

export const PAGE_ROUTE_ID = 'rspress-page';

export function pageDataLoader({ request }: LoaderFunctionArgs) {
  // initPageData also preloads the lazy page component. React Router commits
  // the new location and its page data together after this promise resolves.
  return initPageData(removeBase(new URL(request.url).pathname));
}
