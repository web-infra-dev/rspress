import virtualI18nText from 'virtual-i18n-text';
import { createVirtualStore } from './createVirtualStore';

const store =
  createVirtualStore<Record<string, Record<string, string>>>(virtualI18nText);

export function useI18nText() {
  return store.useValue();
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-i18n-text', () => {
    store.update(virtualI18nText);
  });
}
