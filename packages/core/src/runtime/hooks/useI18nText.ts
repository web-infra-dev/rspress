import virtualI18nText from 'virtual-i18n-text';
import { createExternalStore } from '../createExternalStore';

const store = createExternalStore(virtualI18nText);

export function useI18nText() {
  return store.useValue();
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-i18n-text', () => {
    store.update(virtualI18nText);
  });
}
