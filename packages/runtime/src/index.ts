export { Head } from '@unhead/react';
export {
  createPortal,
  flushSync,
} from 'react-dom';
export {
  BrowserRouter,
  matchPath,
  matchRoutes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
export { Content } from './Content';
export { ThemeContext, useDark } from './hooks/useDark';
export { useFrontmatter } from './hooks/useFrontmatter';
export { useI18n } from './hooks/useI18n';
export { useLang } from './hooks/useLang';
export { useLocaleSiteData } from './hooks/useLocaleSiteData';
export { useNav } from './hooks/useNav';
export { usePage } from './hooks/usePage';
export { DataContext, usePageData } from './hooks/usePageData';
export { getSidebarDataGroup, useSidebar } from './hooks/useSidebar';
export { useSite as useSiteData } from './hooks/useSite';

export { useVersion } from './hooks/useVersion';
export { useWindowSize } from './hooks/useWindowSize';
export { NoSSR } from './NoSSR';
export {
  isActive,
  pathnameToRouteService,
} from './route';
export {
  addLeadingSlash,
  isEqualPath,
  isProduction,
  normalizeHrefInRuntime,
  normalizeImagePath,
  normalizeSlash,
  removeBase,
  removeTrailingSlash,
  withBase,
} from './utils';
