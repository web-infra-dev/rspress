import {
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useCssEntry } from '../../docs/components/CssModificationContext';
import { getPreviewStyles } from './previewStyles';
import type { ThemePreset, ThemePreviewModule } from './types';

interface ThemePresetContextValue {
  presets: readonly ThemePreset[];
  activePreset: ThemePreset;
  activeModule: ThemePreviewModule | undefined;
  loadingId: string | undefined;
  error: boolean;
  selectPreset: (id: string) => Promise<void>;
  loadPreset: (preset: ThemePreset) => Promise<ThemePreviewModule | undefined>;
}

const ThemePresetContext = createContext<ThemePresetContextValue | null>(null);

export function ThemePresetProvider({
  presets,
  defaultPresetId,
  children,
}: {
  presets: readonly ThemePreset[];
  defaultPresetId: string;
  children: ReactNode;
}) {
  const defaultPreset = presets.find(preset => preset.id === defaultPresetId);
  if (!defaultPreset || defaultPreset.load) {
    throw new Error(
      'The default preset must exist and use the original website theme.',
    );
  }
  if (new Set(presets.map(preset => preset.id)).size !== presets.length) {
    throw new Error('Theme preset IDs must be unique.');
  }
  const [selection, setSelection] = useState<{
    id: string;
    module?: ThemePreviewModule;
  }>({ id: defaultPresetId });
  const [loadingId, setLoadingId] = useState<string>();
  const [error, setError] = useState(false);
  const requests = useRef(0);
  const transitioning = useRef(false);
  const modules = useRef(new Map<string, Promise<ThemePreviewModule>>());
  const [css, setCss] = useCssEntry('rspress-theme-preset', '');
  const activePreset = css
    ? (presets.find(preset => preset.id === selection.id) ?? defaultPreset)
    : defaultPreset;
  const activeModule = css ? selection.module : undefined;

  const previousCss = useRef(css);
  useLayoutEffect(() => {
    if (previousCss.current && !css) {
      // The existing Reset toolbar also invalidates a theme still loading.
      requests.current++;
      setLoadingId(undefined);
      setError(false);
    }
    previousCss.current = css;
  }, [css]);

  async function loadPreset(preset: ThemePreset) {
    if (!preset.load) return undefined;
    let promise = modules.current.get(preset.id);
    if (!promise) {
      promise = preset.load();
      modules.current.set(preset.id, promise);
      promise.catch(() => modules.current.delete(preset.id));
    }
    return promise;
  }

  async function selectPreset(id: string) {
    const preset = presets.find(preset => preset.id === id);
    if (!preset) throw new Error(`Unknown theme preset: ${id}`);
    if (transitioning.current || (id === activePreset.id && !loadingId)) return;
    const request = ++requests.current;
    setLoadingId(id);
    setError(false);
    try {
      const module = await loadPreset(preset);
      if (request !== requests.current) return;
      const update = () => {
        if (request !== requests.current) return;
        flushSync(() => {
          setSelection({ id, module });
          setCss(
            preset.load ? getPreviewStyles(id) || `/* ${id} preview */` : '',
          );
          setLoadingId(undefined);
        });
      };
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reduced || !document.startViewTransition) {
        update();
        if (!reduced)
          document.documentElement.animate([{ opacity: 0.7 }, { opacity: 1 }], {
            duration: 240,
            easing: 'ease-out',
          });
        return;
      }
      const root = document.documentElement;
      root.classList.add('rp-preset-transition');
      transitioning.current = true;
      let updated = false;
      try {
        const transition = document.startViewTransition(() => {
          updated = true;
          update();
        });
        transition.ready.catch(() => transition.skipTransition());
        await transition.finished.catch(() => {});
      } catch {
        if (!updated) update();
      } finally {
        root.classList.remove('rp-preset-transition');
        transitioning.current = false;
      }
    } catch {
      if (request === requests.current) {
        setLoadingId(undefined);
        setError(true);
      }
    }
  }

  return (
    <ThemePresetContext.Provider
      value={{
        presets,
        activePreset,
        activeModule,
        loadingId,
        error,
        selectPreset,
        loadPreset,
      }}
    >
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset() {
  const context = useContext(ThemePresetContext);
  if (!context)
    throw new Error('useThemePreset must be used within ThemePresetProvider');
  return context;
}
