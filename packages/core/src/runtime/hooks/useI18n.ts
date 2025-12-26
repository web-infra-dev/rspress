import type { I18nText } from '@rspress/shared';
import { useCallback } from 'react';
import i18nTextData from 'virtual-i18n-text';
import { useLang } from './useLang';

export function useI18n<T>() {
  const lang = useLang();
  return useCallback<(key: keyof (T & I18nText)) => string>(
    (key: keyof (T & I18nText)) => {
      const text: string = i18nTextData[key as string]?.[lang];

      if (typeof text !== 'string') {
        throw new Error(
          `i18n key "${key as string}" not found for language "${lang}"`,
        );
      }

      return text;
    },
    [lang],
  );
}
