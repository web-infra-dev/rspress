import { Link } from '@theme';
import type { ComponentProps } from 'react';
import { usePathUtils } from '../../../logic/usePathUtils';
import * as styles from './index.module.scss';

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
      className={`${className} ${styles.link} ${styles.inlineLink}`}
      href={normalizeLinkHref(href)}
    />
  );
};
