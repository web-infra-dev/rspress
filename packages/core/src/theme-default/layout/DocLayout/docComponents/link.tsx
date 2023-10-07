import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { usePathUtils } from '@/theme-default/logic';
import { Link } from '@/theme-default/components/Link';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;
  const { normalizeLinkHref } = usePathUtils();

  if (className.includes('header-anchor')) {
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
