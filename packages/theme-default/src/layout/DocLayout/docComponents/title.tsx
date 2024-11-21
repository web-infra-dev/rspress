import type React from 'react';
import styles from './index.module.scss';

import clsx from '../../../utils/tailwind';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  const { className, ...restProps } = props;

  return (
    <h1
      {...restProps}
      className={clsx(
        'text-3xl mb-10 leading-10 tracking-tight',
        styles.title,
        className,
      )}
    />
  );
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  const { className, ...restProps } = props;

  return (
    <h2
      {...restProps}
      className={clsx(
        'mt-12 mb-6 pt-8 text-2xl tracking-tight border-t-[1px] border-divider-light',
        styles.title,
        className,
      )}
    />
  );
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  const { className, ...restProps } = props;

  return (
    <h3
      {...restProps}
      className={clsx('mt-10 mb-2 leading-7 text-xl', styles.title, className)}
    />
  );
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  const { className, ...restProps } = props;

  return (
    <h4
      {...restProps}
      className={clsx('mt-8 leading-6 text-lg', styles.title, className)}
    />
  );
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  const { className, ...restProps } = props;

  return <h5 {...restProps} className={clsx(styles.title, className)} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  const { className, ...restProps } = props;

  return <h6 {...restProps} className={clsx(styles.title, className)} />;
};
