import { isProduction } from '@rspress/shared';
import siteData from 'virtual-site-data';
import { RootApp } from './ClientApp';

const enableSSG = siteData.ssg;

// eslint-disable-next-line import/no-commonjs

export async function renderInBrowser() {
  const container = document.getElementById('root')!;

  if (process.env.__REACT_GTE_18__) {
    const { createRoot, hydrateRoot } = require('react-dom/client');
    if (isProduction() && enableSSG) {
      hydrateRoot(container, <RootApp />);
    } else {
      createRoot(container).render(<RootApp />);
    }
  } else {
    const ReactDOM = require('react-dom');
    if (isProduction()) {
      ReactDOM.hydrate(<RootApp />, container);
    } else {
      ReactDOM.render(<RootApp />, container);
    }
  }
}

renderInBrowser();
