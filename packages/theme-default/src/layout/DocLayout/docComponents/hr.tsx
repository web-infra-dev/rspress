import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { divider } from './hr.module.scss';

export const Hr = (props: ComponentProps<'hr'>) => {
  return <hr {...props} className={clsx(divider, props.className)} />;
};
