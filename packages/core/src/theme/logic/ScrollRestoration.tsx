import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'rspress-scroll-positions';
const SCROLL_THROTTLE_MS = 100;

let savedScrollPositions: Record<string, number> = {};
let isInitialized = false;

function loadFromSessionStorage() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      savedScrollPositions = JSON.parse(stored);
    }
  } catch {
    // ignore
  }
}

function persistToSessionStorage() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedScrollPositions));
  } catch {
    // ignore
  }
}

// The inline script that runs before React hydration.
// It reads the saved scroll position from sessionStorage and restores it immediately,
// preventing a flash of wrong scroll position.
const inlineScript = `(function(){
  try {
    var k = window.history.state && window.history.state.key;
    if (k) {
      var p = JSON.parse(sessionStorage.getItem('${STORAGE_KEY}') || '{}');
      var y = p[k];
      if (typeof y === 'number') {
        window.history.scrollRestoration = 'manual';
        window.scrollTo(0, y);
      }
    }
  } catch(e) {}
})()`;

function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevKeyRef = useRef<string | undefined>(undefined);

  // Initialize: load from sessionStorage, take control of scroll restoration
  useLayoutEffect(() => {
    if (!isInitialized) {
      loadFromSessionStorage();
      isInitialized = true;
    }
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = 'auto';
    };
  }, []);

  // Save scroll position continuously via throttled scroll listener
  useLayoutEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      setTimeout(() => {
        const key = location.key;
        if (key) {
          savedScrollPositions[key] = window.scrollY;
        }
        ticking = false;
      }, SCROLL_THROTTLE_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.key]);

  // Persist to sessionStorage on pagehide
  useLayoutEffect(() => {
    const onPageHide = () => {
      // Save current position one last time
      const key = location.key;
      if (key) {
        savedScrollPositions[key] = window.scrollY;
      }
      persistToSessionStorage();
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [location.key]);

  // Handle scroll on navigation
  useLayoutEffect(() => {
    // Save previous page's scroll position
    const prevKey = prevKeyRef.current;
    if (prevKey) {
      savedScrollPositions[prevKey] = window.scrollY;
    }
    prevKeyRef.current = location.key;

    const hash = decodeURIComponent(window.location.hash);

    if (navigationType === 'POP') {
      // Back/forward: restore saved position
      const savedY = location.key
        ? savedScrollPositions[location.key]
        : undefined;
      if (typeof savedY === 'number') {
        window.scrollTo(0, savedY);
      }
    } else if (hash.length === 0) {
      // New navigation without hash: scroll to top
      window.scrollTo(0, 0);
    }
    // With hash: do nothing here, let useScrollAfterNav handle it
  }, [location, navigationType]);
}

/**
 * @private
 * @unstable
 */
export function ScrollRestoration() {
  useScrollRestoration();

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional inline script for pre-hydration scroll restoration
      dangerouslySetInnerHTML={{ __html: inlineScript }}
    />
  );
}
