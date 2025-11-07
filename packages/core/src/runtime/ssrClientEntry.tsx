import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';

// difference from csrClientEntry.tsx
// 1. use hydrate instead of createRoot().render()
// 2. initPageData() should already be inited when hydrateRoot()
// 3. add onRecoverableError

async function renderInBrowser() {
  const container = document.getElementById('__rspress_root')!;
  // why startTransition?
  // https://github.com/facebook/docusaurus/pull/9051
  startTransition(() => {
    hydrateRoot(container, <ClientApp />, {
      onRecoverableError(error, errorInfo) {
        if (error instanceof Error) {
          console.warn('hydrateRoot recoverable error:', error, errorInfo);
        }
      },
    });
  });
}

renderInBrowser();
