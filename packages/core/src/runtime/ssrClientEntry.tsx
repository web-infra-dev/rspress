import { hydrateRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';
import { initPageData } from './initPageData';

// difference from csrClientEntry.tsx
// 1. use hydrate instead of createRoot().render()
// 2. initPageData() should already be inited when hydrateRoot()

async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const initialPageData = await initPageData(window.location.pathname);
  hydrateRoot(container, <ClientApp initialPageData={initialPageData} />);
}

renderInBrowser();
