import minimalMeta from '../../themes/minimal/meta';
import type { ThemePreset } from './types';

export const themePresets: readonly ThemePreset[] = [
  {
    id: 'rspress',
    name: 'Rspress',
    description: {
      en: 'Bright blue. The familiar default theme.',
      zh: '明亮的蓝色，熟悉的默认主题。',
    },
    palette: ['#0095ff', '#ffffff', '#f8f8f9', '#242424'],
    preview: {
      light: {
        accent: '#0095ff',
        tint: '#eaf4ff',
        background: '#fff',
        soft: '#fafafa',
        border: '#e4e4e7',
        line: '#d4d4d8',
        text: '#18181b',
      },
      dark: {
        accent: '#0095ff',
        tint: '#172554',
        background: '#121212',
        soft: '#191919',
        border: '#343a46',
        line: '#52525b',
        text: '#f4f4f5',
      },
    },
  },
  {
    ...minimalMeta,
    load: () => import('../../themes/minimal/index?theme-preview'),
  },
];

export const defaultThemePresetId = 'rspress';
