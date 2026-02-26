import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'rspress-scroll-positions';
const MAX_SCROLL_ENTRIES = 100;

// Module-level state for scroll positions
let savedScrollPositions: Record<string, number> = {};

/**
 * Parse CSS length value to number (in pixels).
 * Supports: px
 */
function parseCSSLength(value: string): number {
  if (!value || value === 'auto' || value === 'none') {
    return 0;
  }

  const numValue = Number.parseFloat(value);
  if (Number.isNaN(numValue)) {
    return 0;
  }

  return numValue;
}

/**
 * Scroll to a hash target element, respecting scroll-padding-top.
 */
function scrollToHashTarget(hash: string): boolean {
  const target = document.getElementById(hash.slice(1));
  if (!target) {
    return false;
  }

  const scrollPaddingTop = parseCSSLength(
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('scroll-padding-top'),
  );

  const offsetTop = Math.round(
    window.scrollY + target.getBoundingClientRect().top - scrollPaddingTop,
  );

  window.scrollTo({ left: 0, top: offsetTop });
  return true;
}

/**
 * Get the scroll restoration key from location.
 * Uses location.key by default, which provides unique keys for each navigation.
 */
function getScrollRestorationKey(location: { key: string }): string {
  return location.key;
}

/**
 * Load scroll positions from sessionStorage.
 */
function loadSavedPositions(): void {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      savedScrollPositions = JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Persist scroll positions to sessionStorage.
 * Prunes oldest entries if exceeding MAX_SCROLL_ENTRIES.
 */
function persistSavedPositions(): void {
  try {
    const keys = Object.keys(savedScrollPositions);
    if (keys.length > MAX_SCROLL_ENTRIES) {
      // Remove oldest entries (first inserted keys)
      const excess = keys.length - MAX_SCROLL_ENTRIES;
      for (let i = 0; i < excess; i++) {
        delete savedScrollPositions[keys[i]];
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedScrollPositions));
  } catch {
    // Ignore errors
  }
}

// The inline script that runs before React hydration.
// It reads the saved scroll position from sessionStorage and restores it immediately,
// preventing a flash of wrong scroll position.
const inlineScript = `(function(){
  try {
    // Ensure history.state.key exists (React Router behavior)
    if (!window.history.state || !window.history.state.key) {
      var key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key: key }, "");
    }
    
    var positions = JSON.parse(sessionStorage.getItem('${STORAGE_KEY}') || '{}');
    var y = positions[window.history.state.key];
    if (typeof y === 'number') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, y);
    }
  } catch(e) {}
})()`;

/**
 * Hook for scroll restoration logic.
 * Follows React Router's implementation closely.
 */
function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevKeyRef = useRef<string | undefined>(undefined);

  // Initialize: load from sessionStorage, take control of scroll restoration
  useLayoutEffect(() => {
    loadSavedPositions();
    window.history.scrollRestoration = 'manual';

    // Handle hashchange for same-page anchor navigation
    // This is needed because clicking an anchor link doesn't trigger
    // React Router navigation (no PUSH/REPLACE), but we need to scroll
    // since scrollRestoration is 'manual'
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.length > 0) {
        scrollToHashTarget(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Save positions on pagehide for tab close / page refresh scenarios.
  // Reads key from history.state directly so this effect only runs once.
  useLayoutEffect(() => {
    const onPageHide = () => {
      const state = window.history.state;
      const key = state?.key;
      if (key) {
        savedScrollPositions[key] = window.scrollY;
        persistSavedPositions();
      }
      // Let browser handle scroll restoration on page refresh
      window.history.scrollRestoration = 'auto';
    };

    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  // Handle scroll on navigation
  useLayoutEffect(() => {
    const prevKey = prevKeyRef.current;
    const currentKey = getScrollRestorationKey(location);
    prevKeyRef.current = currentKey;

    // Save the previous page's scroll position before handling the new page.
    // This is essential for SPA navigation where pagehide does not fire.
    if (prevKey) {
      savedScrollPositions[prevKey] = window.scrollY;
      persistSavedPositions();
    }

    // For POP navigation (back/forward), restore saved position
    if (navigationType === 'POP') {
      const savedY = savedScrollPositions[currentKey];

      if (typeof savedY === 'number') {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(0, savedY);
        });
      }
      // If no saved position, let browser handle it naturally
      return;
    }

    // For PUSH/REPLACE navigation
    const hash = decodeURIComponent(window.location.hash);

    if (hash.length > 0) {
      // Try to scroll to hash target
      // Use requestAnimationFrame to ensure target element is rendered
      requestAnimationFrame(() => {
        scrollToHashTarget(hash);
      });
    } else {
      // Scroll to top for new navigation
      window.scrollTo(0, 0);
    }
  }, [location, navigationType]);
}

/**
 * Scroll restoration component inspired by React Router's ScrollRestoration.
 *
 * This component:
 * 1. Renders an inline script that restores scroll position before React hydration
 * 2. Sets up scroll position saving on pagehide
 * 3. Handles scroll restoration on navigation
 *
 * @see https://reactrouter.com/api/components/ScrollRestoration
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
