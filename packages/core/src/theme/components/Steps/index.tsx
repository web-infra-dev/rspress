import type { ReactNode } from 'react';
import './index.scss';
import { PREFIX } from '../../constant';

export function Steps({ children }: { children: ReactNode }) {
  return <div className={`${PREFIX}steps`}>{children}</div>;
}
