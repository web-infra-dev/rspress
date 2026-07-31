import { createRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';
import { redirectToCleanUrl } from './route';

function renderInBrowser() {
  redirectToCleanUrl(window.location, window.history);

  const container = document.getElementById('__rspress_root')!;
  createRoot(container).render(<ClientApp />);
}

renderInBrowser();
