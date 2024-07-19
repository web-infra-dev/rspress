import { useLang } from 'rspress/runtime';

export const EN_US = {
  toolStackTitle: 'Tool Stack',
  toolStackDesc:
    'High-performance tool stack built around Rspack to boost modern web development',
} as const;

export const ZH_CN: Record<keyof typeof EN_US, string> = {
  toolStackTitle: '工具栈',
  toolStackDesc: '围绕 Rspack 打造的高性能工具栈，助力现代 Web 开发',
};

const translations = {
  en: EN_US,
  zh: ZH_CN,
} as const;

export function useI18n() {
  const lang = useLang() as keyof typeof translations;
  return (key: keyof typeof EN_US) => translations[lang][key];
}
