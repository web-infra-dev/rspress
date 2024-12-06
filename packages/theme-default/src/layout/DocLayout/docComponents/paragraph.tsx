import type { ComponentProps } from 'react';
import styles from './index.module.scss';

import clsx from '../../../utils/tailwind';

export const P = (props: ComponentProps<'p'>) => {
  const { className, ...restProps } = props;

  return <p {...restProps} className={clsx('my-4 leading-7', className)} />;
};

export const Blockquote = (props: ComponentProps<'blockquote'>) => {
  const { className, ...restProps } = props;

  return (
    <blockquote
      {...restProps}
      className={clsx(
        'border-l-2 border-solid border-divider pl-4 my-6 transition-colors duration-500',
        styles.blockquote,
        className,
      )}
    />
  );
};

export const Strong = (props: ComponentProps<'strong'>) => {
  const { className, ...restProps } = props;

  return <strong {...restProps} className={clsx('font-semibold', className)} />;
};
