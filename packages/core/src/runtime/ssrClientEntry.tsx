import { removeBase } from '@rspress/runtime';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';
import { initPageData } from './initPageData';

// difference from csrClientEntry.tsx
// 1. use hydrate instead of createRoot().render()
// 2. initPageData() should already be inited when hydrateRoot()
// 3. add onRecoverableError

async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const initialPageData = await initPageData(
    removeBase(window.location.pathname),
  );
  // why startTransition?
  // https://github.com/facebook/docusaurus/pull/9051
  startTransition(() => {
    hydrateRoot(container, <ClientApp initialPageData={initialPageData} />, {
      onRecoverableError(error, errorInfo) {
        if (error instanceof Error) {
          console.warn('hydrateRoot recoverable error:', error, errorInfo);
        }
      },
    });
  });
}

renderInBrowser();
