import { useCallback } from 'react';
import i18nTextData from 'virtual-i18n-text';
import { useLang } from './useLang';

export function useI18n<T = Record<string, Record<string, string>>>() {
  const lang = useLang();
  return useCallback((key: keyof T) => i18nTextData[key][lang], [lang]);
}
