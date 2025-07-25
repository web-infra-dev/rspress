import { Link } from '@theme';
import type { ComponentProps } from 'react';
import * as styles from './index.module.scss';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;

  return (
    <Link
      {...props}
      className={`${className} ${styles.link} ${styles.inlineLink}`}
      href={href}
    />
  );
};
