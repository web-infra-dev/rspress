import ruixenCss from '../../docs/public/themes/ruixen.css?raw';
import {
  Outline as RuixenOutline,
  RuixenBreadcrumb,
} from '../../docs/public/themes/ruixen';
import type { ThemePreset } from './types';

// Theme-specific imports and resource locations belong only in this registry.
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
    id: 'ruixen',
    name: 'Ruixen',
    description: {
      en: 'Neutral colors, fine borders, and soft corners.',
      zh: '黑白灰、细边框与柔和圆角。',
    },
    palette: ['#18181b', '#ffffff', '#f4f4f5', '#71717a'],
    preview: {
      light: {
        accent: '#18181b',
        tint: '#f4f4f5',
        background: '#fff',
        soft: '#fafafa',
        border: '#e4e4e7',
        line: '#d4d4d8',
        text: '#18181b',
      },
      dark: {
        accent: '#fafafa',
        tint: '#27272a',
        background: '#09090b',
        soft: '#18181b',
        border: '#27272a',
        line: '#52525b',
        text: '#f4f4f5',
      },
      showDividers: false,
    },
    stylesheet: {
      content: ruixenCss,
      download: {
        href: '/themes/ruixen.css',
        fileName: 'ruixen.css',
        label: { en: 'Download CSS', zh: '下载 CSS' },
      },
    },
    downloads: [
      {
        href: '/themes/ruixen.tsx',
        fileName: 'ruixen.tsx',
        label: { en: 'Download theme entry', zh: '下载主题入口' },
      },
    ],
    components: { Breadcrumb: RuixenBreadcrumb, Outline: RuixenOutline },
  },
];

export const defaultThemePresetId = 'rspress';
