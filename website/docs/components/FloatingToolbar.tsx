import type { ReactNode } from 'react';
import styles from './FloatingToolbar.module.scss';

export function FloatingToolbar({
  label,
  kind,
  placement,
  children,
}: {
  label: string;
  kind: 'slots' | 'css';
  placement: 'top' | 'bottom';
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.toolbar} ${styles[placement]}`}
      role="region"
      aria-label={label}
    >
      <span className={styles.status}>
        <span className={styles.icon} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {kind === 'slots' ? (
              <>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 9v12" />
              </>
            ) : (
              <>
                <path d="m14 5 5 5M4 20l4-1 12-12a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
                <path d="M13 20h7" />
              </>
            )}
          </svg>
        </span>
        {label}
      </span>
      <div className={styles.actions}>{children}</div>
    </div>
  );
}
