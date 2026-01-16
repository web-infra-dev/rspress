import { useEffect } from 'react';
import { useCssModification } from './CssModificationContext';

/**
 * Component that syncs CSS from context to style elements in the document head.
 * This component should be rendered once at the top level of the app.
 */
export function CssStyleSync() {
  const { entries } = useCssModification();

  useEffect(() => {
    // Sync all entries to their corresponding style elements
    entries.forEach((entry, id) => {
      let styleEl = document.getElementById(id) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = id;
        document.head.appendChild(styleEl);
      }
      if (styleEl.textContent !== entry.currentValue) {
        styleEl.textContent = entry.currentValue;
      }
    });
  }, [entries]);

  return null;
}
