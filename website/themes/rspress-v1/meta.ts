export default {
  id: 'rspress-v1',
  name: 'Rspress v1',
  description: {
    en: 'Classic blue, Open Sans, and slate dark mode. Inspired by Rspress v1.',
    zh: '经典蓝色、Open Sans 字体与蓝灰暗色背景。参考 Rspress v1。',
  },
  palette: ['#0095ff', '#ffffff', '#213547', '#191d24'],
  preview: {
    light: {
      accent: '#0077ff',
      tint: '#7fa3ff29',
      background: '#ffffff',
      soft: '#f6f8fa',
      border: '#3c3c3c1a',
      line: '#a8b2c1',
      text: '#213547',
    },
    dark: {
      accent: '#33adff',
      tint: '#7fa3ff29',
      background: '#191d24',
      soft: '#222934',
      border: '#5454547a',
      line: '#536171',
      text: '#fffff5ed',
    },
    showDividers: false,
  },
  source: {
    repository: 'https://github.com/web-infra-dev/rspress',
    ref: 'main',
    directory: 'website/themes/rspress-v1',
  },
} as const;
