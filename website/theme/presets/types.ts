import type { LayoutProps, Outline } from '@rspress/core/theme-original';
import type { ComponentType } from 'react';

export type PresetText = string | { en: string; zh: string };

export interface ThemePresetColors {
  accent: string;
  tint: string;
  background: string;
  soft: string;
  border: string;
  line: string;
  text: string;
}

/** Portable metadata in each theme's meta.ts; no website imports are required. */
export interface ThemePresetMeta {
  id: string;
  name: string;
  description: PresetText;
  palette: readonly string[];
  preview: {
    light: ThemePresetColors;
    dark: ThemePresetColors;
    showDividers?: boolean;
  };
  source?: {
    repository: string;
    ref: string;
    directory: string;
  };
}

/**
 * Deliberately bounded website preview surface, not a core theme API.
 * To add DocFooter etc., extend this type AND supportedPreviewExports, then
 * add a resolver wrapper/export in website/theme/index.tsx and test switching.
 * Search, Root, and startup hooks stay owned by the website runtime.
 */
export interface ThemePreviewModule {
  Layout?: ComponentType<LayoutProps>;
  Outline?: typeof Outline;
}

export const supportedPreviewExports = ['Layout', 'Outline'] as const;

export interface ThemePreset extends ThemePresetMeta {
  /** Normal theme source is built by the website; this query only enables reversible CSS. */
  load?: () => Promise<ThemePreviewModule>;
}

export function localizePresetText(text: PresetText, lang: string): string {
  return typeof text === 'string' ? text : lang === 'zh' ? text.zh : text.en;
}
