import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { usePathUtils } from '@/theme-default/logic';
import { Link } from '@/theme-default/components/Link';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '' } = props;
  const { normalizeLinkHref } = usePathUtils();

  return (
    <Link
      {...props}
      className={`${styles.link} ${styles['inline-link']} ${props.className}`}
      href={normalizeLinkHref(href)}
    ></Link>
  );
};
