import { createRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';
import { redirectToBaseWithTrailingSlash } from './utils';

function renderInBrowser() {
  redirectToBaseWithTrailingSlash(window.location, window.history);

  const container = document.getElementById('__rspress_root')!;
  createRoot(container).render(<ClientApp />);
}

renderInBrowser();
