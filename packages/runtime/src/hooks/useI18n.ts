import type { I18nText } from '@rspress/shared';
import { useCallback } from 'react';
import i18nTextData from 'virtual-i18n-text';
import { useLang } from './useLang';

export function useI18n<T>() {
  const lang = useLang();
  return useCallback<(key: keyof (T & I18nText)) => string>(
    (key: keyof (T & I18nText)) => i18nTextData[key][lang],
    [lang],
  );
}
