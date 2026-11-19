// This file is portable metadata, not a dependency on the website preview runtime.
export default {
  id: 'minimal',
  name: 'Minimal',
  description: {
    en: 'Neutral colors and soft corners. Inspired by Ruixen UI.',
    zh: '黑白灰、细边框与柔和圆角。灵感来自 Ruixen UI。',
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
  source: {
    repository: 'https://github.com/web-infra-dev/rspress',
    ref: 'soon-codex/website-theme-presets',
    directory: 'website/themes/minimal',
  },
} as const;
