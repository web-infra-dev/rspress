import { ClientApp } from './ClientApp';

async function renderInBrowser() {
  const container = document.getElementById('root')!;

  if (process.env.__REACT_GTE_18__) {
    const { createRoot } = await import('react-dom/client');
    createRoot(container).render(<ClientApp />);
  } else {
    const ReactDOM = await import('react-dom');
    ReactDOM.render(<ClientApp />, container);
  }
}

renderInBrowser();
