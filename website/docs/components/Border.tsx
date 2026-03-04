import type { ReactNode } from 'react';

export const Border = ({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      style={{
        border: '1px solid var(--rp-c-divider-light)',
        borderRadius: 'var(--rp-radius)',
        padding: '10px',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};
