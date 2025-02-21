import { Link } from '@theme';
import type { ComponentProps } from 'react';
import { usePathUtils } from '../../../logic';
import styles from './index.module.scss';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;
  const { normalizeLinkHref } = usePathUtils();

  return (
    <Link
      {...props}
      className={`${className} ${styles.link} ${styles['inline-link']}`}
      href={normalizeLinkHref(href)}
    />
  );
};
