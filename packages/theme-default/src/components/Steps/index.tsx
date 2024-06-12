import type { ReactNode } from 'react';
import styles from './index.module.scss';

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div
      className={`ml-4 mb-11 border-l pl-6 ${styles.rspressSteps} [counter-reset:step]`}
    >
      {children}
    </div>
  );
}
