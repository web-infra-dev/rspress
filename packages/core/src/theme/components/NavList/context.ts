import { createContext } from 'react';

export const NavListContext = createContext<'bar' | 'items' | 'screen'>('bar');
