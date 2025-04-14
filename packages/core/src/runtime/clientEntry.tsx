import { isProduction } from '@rspress/shared';
import siteData from 'virtual-site-data';
import { ClientApp } from './ClientApp';
import { initPageData } from './initPageData';

const enableSSG = siteData.ssg;

// eslint-disable-next-line import/no-commonjs

async function renderInBrowser() {
  const container = document.getElementById('root')!;
  const initialPageData = await initPageData(window.location.pathname);

  if (process.env.__REACT_GTE_18__) {
    const { createRoot, hydrateRoot } = await import('react-dom/client');
    if (isProduction() && enableSSG) {
      hydrateRoot(container, <ClientApp initialPageData={initialPageData} />);
    } else {
      createRoot(container).render(
        <ClientApp initialPageData={initialPageData} />,
      );
    }
  } else {
    const ReactDOM = await import('react-dom');
    if (isProduction()) {
      ReactDOM.hydrate(
        <ClientApp initialPageData={initialPageData} />,
        container,
      );
    } else {
      ReactDOM.render(
        <ClientApp initialPageData={initialPageData} />,
        container,
      );
    }
  }
}

renderInBrowser();
