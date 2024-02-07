import { ComponentProps } from 'react';
import { Link } from '../../../components/Link';
import styles from './index.module.scss';
import { usePathUtils } from '#theme/logic';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;
  const { normalizeLinkHref } = usePathUtils();
  const hasHeaderAnchor = className.includes('header-anchor');

  if (hasHeaderAnchor || href.startsWith('#')) {
    return <a {...props} className={`${styles.link} ${className}`} />;
  } else {
    return (
      <Link
        {...props}
        className={`${className} ${styles.link} ${styles['inline-link']}`}
        href={normalizeLinkHref(href)}
      />
    );
  }
};
