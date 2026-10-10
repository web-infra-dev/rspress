import { removeBase } from '@rspress/core/runtime';
import { startTransition } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';
import { initPageData, setCurrentPageData } from './initPageData';
import { redirectToCleanUrl } from './route';

// difference from csrClientEntry.tsx
// 1. use hydrate instead of createRoot().render() when there is SSG HTML
// 2. initPageData() should already be inited when hydrateRoot()
// 3. add onRecoverableError when hydrating

async function renderInBrowser() {
  redirectToCleanUrl(window.location, window.history);

  const container = document.getElementById('__rspress_root')!;
  const pathname = removeBase(window.location.pathname);
  const initialPageData = await initPageData(pathname);
  setCurrentPageData(pathname, initialPageData);
  // why startTransition?
  // https://github.com/facebook/docusaurus/pull/9051
  startTransition(() => {
    // Routes excluded from SSG (ssg.experimentalExcludeRoutePaths) or pages
    // whose SSG was effectively skipped (ssg: false with llms) ship an empty
    // container: there is nothing to hydrate, so createRoot avoids the
    // hydration recoverable errors (#418/#423) that hydrateRoot would report
    if (container.firstElementChild) {
      hydrateRoot(container, <ClientApp initialPageData={initialPageData} />, {
        onRecoverableError(error, errorInfo) {
          if (error instanceof Error) {
            console.warn('hydrateRoot recoverable error:', error, errorInfo);
          }
        },
      });
    } else {
      createRoot(container).render(
        <ClientApp initialPageData={initialPageData} />,
      );
    }
  });
}

renderInBrowser();
