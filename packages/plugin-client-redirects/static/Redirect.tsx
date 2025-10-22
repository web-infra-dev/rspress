import { isExternalUrl, useLocation } from '@rspress/core/runtime';
import { useEffect, useMemo } from 'react';

// these are types copied from src/types.ts
type RedirectRule = {
  to: string;
  from: string | string[];
};

type RedirectsOptions = {
  redirects?: RedirectRule[];
};

export default function Redirect(props: RedirectsOptions = {}) {
  const { pathname, hash } = useLocation();
  const { redirects } = props;

  // Use useMemo to preprocess redirect rules to avoid recreating RegExp objects every time you render
  const processedRedirects = useMemo(() => {
    if (!redirects?.length) return [];

    return redirects.map(({ from, to }) => ({
      to,
      patterns: Array.isArray(from) ? from : [from],
    }));
  }, [redirects]);

  useEffect(() => {
    // If there is no redirect rule or if it is not in the browser environment, it will be returned
    if (!processedRedirects.length || typeof window === 'undefined') {
      return;
    }

    for (const { patterns, to } of processedRedirects) {
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern);

          if (regex.test(pathname)) {
            if (isExternalUrl(to)) {
              window.location.replace(to);
            } else {
              window.location.replace(pathname.replace(regex, to) + hash);
            }
            return;
          }
        } catch (error) {
          console.warn(`Invalid redirect pattern: ${pattern}`, error);
        }
      }
    }
  }, [pathname, hash, processedRedirects]);

  return null;
}
