import virtualGlobalComponents from 'virtual-global-components';
import { createExternalStore } from './createExternalStore';

const store = createExternalStore(virtualGlobalComponents);

export function useGlobalComponents() {
  return store.useValue();
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-global-components', () => {
    store.update(virtualGlobalComponents);
  });
}
