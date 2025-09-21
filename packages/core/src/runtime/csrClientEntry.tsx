import { createRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';

const container = document.getElementById('__rspress_root')!;
createRoot(container).render(<ClientApp />);
