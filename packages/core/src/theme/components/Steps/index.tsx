import type { ReactNode } from 'react';
import './index.scss';

export function Steps({ children }: { children: ReactNode }) {
  return <div className="rp-steps">{children}</div>;
}
