import { createRoot } from 'react-dom/client';
import { ClientApp, createClientRouter } from './ClientApp';
import { redirectToCleanUrl } from './route';

function renderInBrowser() {
  redirectToCleanUrl(window.location, window.history);

  const container = document.getElementById('__rspress_root')!;
  const router = createClientRouter();
  createRoot(container).render(<ClientApp router={router} />);
}

renderInBrowser();
