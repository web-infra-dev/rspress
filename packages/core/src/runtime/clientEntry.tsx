import { isProduction } from '@rspress/shared';
import siteData from 'virtual-site-data';
import { ClientApp } from './ClientApp';

const enableSSG = siteData.ssg;

// eslint-disable-next-line import/no-commonjs

export async function renderInBrowser() {
  const container = document.getElementById('root')!;

  if (process.env.__REACT_GTE_18__) {
    const { createRoot, hydrateRoot } = require('react-dom/client');
    if (isProduction() && enableSSG) {
      hydrateRoot(container, <ClientApp />);
    } else {
      createRoot(container).render(<ClientApp />);
    }
  } else {
    const ReactDOM = require('react-dom');
    if (isProduction()) {
      ReactDOM.hydrate(<ClientApp />, container);
    } else {
      ReactDOM.render(<ClientApp />, container);
    }
  }
}

renderInBrowser();
