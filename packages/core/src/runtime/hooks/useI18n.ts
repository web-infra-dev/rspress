import type { I18nText } from '@rspress/shared';
import { useCallback } from 'react';
import { useI18nText } from '../virtual/i18n';
import { useLang } from './useLang';

export function useI18n<T>() {
  const lang = useLang();
  const i18nTextData = useI18nText();
  return useCallback<
    (key: keyof (T & I18nText), params?: Record<string, string>) => string
  >(
    (key, params) => {
      const text: string = i18nTextData[key as string]?.[lang];

      if (typeof text !== 'string') {
        throw new Error(
          `i18n key "${key as string}" not found for language "${lang}"`,
        );
      }

      return text.replace(/\{\{(\w+)\}\}/g, (_, p1) => {
        return params?.[p1] ?? `${p1}`;
      });
    },
    [lang, i18nTextData],
  );
}
