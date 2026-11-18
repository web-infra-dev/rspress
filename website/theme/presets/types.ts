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

/** Website integration contract; theme implementations may live in another package. */
export interface ThemePreset {
  /** Stable identity, independent of the display name and stylesheet contents. */
  id: string;
  name: string;
  description: PresetText;
  palette: readonly string[];
  /** Instructions copied for an agent to apply this preset to a user's project. */
  prompt: PresetText;
  preview: {
    light: ThemePresetColors;
    dark: ThemePresetColors;
    showDividers?: boolean;
  };
  /** Omit for the default theme. CSS is bundled so previews work without fetching. */
  stylesheet?: {
    content: string;
  };
  /** Omitted components fall back to the website's original layout. */
  components?: {
    Breadcrumb?: ComponentType;
    Outline?: ComponentType;
  };
}

export function localizePresetText(text: PresetText, lang: string): string {
  return typeof text === 'string' ? text : lang === 'zh' ? text.zh : text.en;
}
