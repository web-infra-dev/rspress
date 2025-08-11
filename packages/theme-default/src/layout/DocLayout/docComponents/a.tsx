import { Link } from '@theme';
import type { ComponentProps } from 'react';
import { inlineLink, link } from './index.module.scss';

export const A = (props: ComponentProps<'a'>) => {
  const { href = '', className = '' } = props;

  return (
    <Link
      {...props}
      className={`${className} ${link} ${inlineLink}`}
      href={href}
    />
  );
};
