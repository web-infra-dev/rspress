import type { ComponentType } from 'react';

export type PresetText = string | { en: string; zh: string };

export interface ThemePresetAsset {
  /** A public path (with the site base applied by the switcher) or an absolute URL. */
  href: string;
  fileName: string;
  label: PresetText;
}

export interface ThemePresetColors {
  accent: string;
  tint: string;
  background: string;
  soft: string;
  border: string;
  line: string;
  text: string;
}

/** Website integration contract; theme implementations may live in another package. */
export interface ThemePreset {
  /** Stable identity, independent of the display name and stylesheet contents. */
  id: string;
  name: string;
  description: PresetText;
  palette: readonly string[];
  preview: {
    light: ThemePresetColors;
    dark: ThemePresetColors;
    showDividers?: boolean;
  };
  /** Omit for the default theme. CSS is bundled so previews work without fetching. */
  stylesheet?: {
    content: string;
    download?: ThemePresetAsset;
  };
  /** Optional installation files, such as a theme entry, hosted locally or remotely. */
  downloads?: readonly ThemePresetAsset[];
  /** Omitted components fall back to the website's original layout. */
  components?: {
    Breadcrumb?: ComponentType;
    Outline?: ComponentType;
  };
}

export function localizePresetText(text: PresetText, lang: string): string {
  return typeof text === 'string' ? text : lang === 'zh' ? text.zh : text.en;
}
