import type React from 'react';
import * as styles from './index.module.scss';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  return (
    <h1
      {...props}
      className={`rspress-doc-title rp-text-3xl rp-mb-10 rp-leading-10 rp-tracking-tight ${styles.title}`}
    />
  );
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  return (
    <h2
      {...props}
      className={`rp-mt-12 rp-mb-6 rp-pt-8 rp-text-2xl rp-tracking-tight rp-border-t rp-border-divider-light ${styles.title}`}
    />
  );
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  return (
    <h3
      {...props}
      className={`rp-mt-10 rp-mb-2 rp-leading-7 rp-text-xl ${styles.title}`}
    />
  );
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  return (
    <h4
      {...props}
      className={`rp-mt-8 rp-leading-6 rp-text-lg ${styles.title}`}
    />
  );
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  return <h5 {...props} className={styles.title} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  return <h6 {...props} className={styles.title} />;
};
