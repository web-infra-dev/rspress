import type { ComponentProps } from 'react';
import styles from './index.module.scss';
import { Link } from '@theme';
import { usePathUtils } from '../../../logic';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;
  const { normalizeLinkHref } = usePathUtils();
  const hasHeaderAnchor = className.includes('header-anchor');

  if (hasHeaderAnchor || href.startsWith('#')) {
    return <a {...props} className={`${styles.link} ${className}`} />;
  }

  return (
    <Link
      {...props}
      className={`${className} ${styles.link} ${styles['inline-link']}`}
      href={normalizeLinkHref(href)}
    />
  );
};
