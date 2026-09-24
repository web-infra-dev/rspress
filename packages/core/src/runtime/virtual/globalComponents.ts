import virtualGlobalComponents from 'virtual-global-components';
import { createVirtualStore } from './createVirtualStore';

const store = createVirtualStore(virtualGlobalComponents);

export function useGlobalComponents() {
  return store.useValue();
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-global-components', () => {
    store.update(virtualGlobalComponents);
  });
}
