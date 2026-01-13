import type { ReactNode } from 'react';

export const Border = ({ children }: { children: ReactNode }) => {
  return (
    <div
      style={{
        border: '1px solid var(--rp-c-divider)',
        borderRadius: 'var(--rp-radius)',
        padding: '10px',
      }}
    >
      {children}
    </div>
  );
};
