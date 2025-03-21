import type { ReactNode } from 'react';
import * as styles from './index.module.scss';

export function Steps({ children }: { children: ReactNode }) {
  return (
    <div
      className={`rp-ml-4 rp-mb-11 rp-border-l rp-pl-6 ${styles.rspressSteps} [counter-reset:step]`}
    >
      {children}
    </div>
  );
}
