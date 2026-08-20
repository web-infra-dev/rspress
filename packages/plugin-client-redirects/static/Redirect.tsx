import { isExternalUrl, useLocation } from '@rspress/core/runtime';
import { useEffect, useMemo } from 'react';

// These types are copied from src/types.ts because this file is shipped as source.
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

  const processedRedirects = useMemo(() => {
    if (!redirects?.length) {
      return [];
    }

    return redirects.map(({ from, to }) => ({
      to,
      patterns: Array.isArray(from) ? from : [from],
    }));
  }, [redirects]);

  useEffect(() => {
    if (!processedRedirects.length || typeof window === 'undefined') {
      return;
    }

    const redirectingKey = Symbol.for('rspress.redirecting');
    if (Reflect.get(window, redirectingKey)) {
      return;
    }

    for (const { patterns, to } of processedRedirects) {
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern);

          if (regex.test(pathname)) {
            Reflect.set(window, redirectingKey, true);
            window.location.replace(
              isExternalUrl(to) ? to : pathname.replace(regex, to) + hash,
            );
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
