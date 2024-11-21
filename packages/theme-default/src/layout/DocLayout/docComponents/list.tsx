import type { ComponentProps } from 'react';

import clsx from '../../../utils/tailwind';

export const Ol = (props: ComponentProps<'ol'>) => {
  const { className, ...restProps } = props;

  return (
    <ol
      {...restProps}
      className={clsx('list-decimal pl-5 my-4 leading-7', className)}
    />
  );
};

export const Ul = (props: ComponentProps<'ul'>) => {
  const { className, ...restProps } = props;

  return (
    <ul
      {...restProps}
      className={clsx('list-disc pl-5 my-4 leading-7', className)}
    />
  );
};

export const Li = (props: ComponentProps<'li'>) => {
  const { className, ...restProps } = props;

  return (
    <li
      {...restProps}
      className={clsx('[&:not(:first-child)]:mt-2', className)}
    />
  );
};
