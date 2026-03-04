import type { I18nText } from '@rspress/shared';
import { useCallback } from 'react';
import i18nTextData from 'virtual-i18n-text';
import { useLang } from './useLang';

export function useI18n<T>() {
  const lang = useLang();
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
    [lang],
  );
}
