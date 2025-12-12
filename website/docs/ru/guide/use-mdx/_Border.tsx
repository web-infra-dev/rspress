import type { ReactNode } from 'react';

export const Border = ({ children }: { children: ReactNode }) => {
  return (
    <div style={{ border: '1px solid var(--rp-c-divider)', padding: '10px' }}>
      {children}
    </div>
  );
};
