import { createContext, type ReactNode, useContext, useState } from 'react';
import { useCssEntry } from '../../docs/components/CssModificationContext';
import type { ThemePreset } from './types';

interface ThemePresetContextValue {
  presets: readonly ThemePreset[];
  activePreset: ThemePreset;
  selectPreset: (id: string) => void;
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
  if (!defaultPreset || defaultPreset.stylesheet) {
    throw new Error(
      'The default preset must exist and use the original stylesheet.',
    );
  }
  if (new Set(presets.map(preset => preset.id)).size !== presets.length) {
    throw new Error('Theme preset IDs must be unique.');
  }
  if (
    presets.some(
      preset =>
        preset.id !== defaultPresetId && !preset.stylesheet?.content.trim(),
    )
  ) {
    throw new Error('Non-default presets must provide a stylesheet.');
  }

  const [selectedId, setSelectedId] = useState(defaultPresetId);
  const [css, setCss] = useCssEntry('rspress-theme-preset', '');
  // Reset in the existing CSS toolbar also restores the original component tree.
  const activePreset = css
    ? (presets.find(preset => preset.id === selectedId) ?? defaultPreset)
    : defaultPreset;

  function selectPreset(id: string) {
    const preset = presets.find(preset => preset.id === id);
    if (!preset) throw new Error(`Unknown theme preset: ${id}`);
    setSelectedId(id);
    setCss(preset.stylesheet?.content ?? '');
  }

  return (
    <ThemePresetContext.Provider
      value={{ presets, activePreset, selectPreset }}
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
