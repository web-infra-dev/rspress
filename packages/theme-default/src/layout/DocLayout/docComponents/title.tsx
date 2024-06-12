import type React from 'react';
import styles from './index.module.scss';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  return (
    <h1
      {...props}
      className={`text-3xl mb-10 leading-10 tracking-tight ${styles.title}`}
    />
  );
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  return (
    <h2
      {...props}
      className={`mt-12 mb-6 pt-8 text-2xl tracking-tight border-t-[1px] border-divider-light ${styles.title}`}
    />
  );
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  return (
    <h3 {...props} className={`mt-10 mb-2 leading-7 text-xl ${styles.title}`} />
  );
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  return <h4 {...props} className={`mt-8 leading-6 text-lg ${styles.title}`} />;
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  return <h5 {...props} className={styles.title} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  return <h6 {...props} className={styles.title} />;
};
