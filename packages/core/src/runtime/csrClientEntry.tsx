import { createRoot } from 'react-dom/client';
import { ClientApp } from './ClientApp';

const container = document.getElementById('root')!;
createRoot(container).render(<ClientApp />);
