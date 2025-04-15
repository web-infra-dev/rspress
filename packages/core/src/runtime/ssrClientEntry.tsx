import { ClientApp } from './ClientApp';
import { initPageData } from './initPageData';

// difference from csrClientEntry.tsx
// 1. use hydrate instead of createRoot().render()
// 2. initPageData() should already be inited when hydrateRoot()

async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const initialPageData = await initPageData(window.location.pathname);

  if (process.env.__REACT_GTE_18__) {
    const { hydrateRoot } = await import('react-dom/client');
    hydrateRoot(container, <ClientApp initialPageData={initialPageData} />);
  } else {
    const ReactDOM = await import('react-dom');
    ReactDOM.hydrate(
      <ClientApp initialPageData={initialPageData} />,
      container,
    );
  }
}

renderInBrowser();
