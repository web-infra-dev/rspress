import { createContext, type ReactNode } from 'react';

export const ContentSourceContext = createContext<ReactNode | null>(null);
