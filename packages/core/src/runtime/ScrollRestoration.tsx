import { useLayoutEffect, useState } from 'react';
import {
  ScrollRestoration as RouterScrollRestoration,
  useLocation,
} from 'react-router-dom';

const STORAGE_KEY = 'rspress-scroll-positions';

export function ScrollRestoration({
  restoreOnHydration,
}: {
  restoreOnHydration: boolean;
}) {
  const location = useLocation();
  const [initialLocation] = useState(location);

  useLayoutEffect(() => {
    if (!restoreOnHydration) {
      return;
    }

    // Data routers skip initial restoration when given hydrationData. Unlike
    // React Router's Framework mode, Rspress has no inline restoration script.
    try {
      const positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      const top = positions?.[initialLocation.key];
      if (typeof top === 'number') {
        window.scrollTo(0, top);
        return;
      }
    } catch {
      // Storage may be unavailable or contain invalid data; still handle hashes.
    }

    if (initialLocation.hash) {
      try {
        document
          .getElementById(decodeURIComponent(initialLocation.hash.slice(1)))
          ?.scrollIntoView();
      } catch {
        // Leave the browser's position unchanged for malformed hashes.
      }
    }
  }, [initialLocation, restoreOnHydration]);

  return <RouterScrollRestoration storageKey={STORAGE_KEY} />;
}
