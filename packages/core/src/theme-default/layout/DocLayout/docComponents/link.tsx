import { ComponentProps } from 'react';
import styles from './index.module.scss';
import { usePathUtils } from '@/theme-default/logic';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '' } = props;
  const { normalizeLinkHref } = usePathUtils();
  return (
    <a
      {...props}
      className={`${styles.link} ${props.className}`}
      href={normalizeLinkHref(href)}
    />
  );
};
