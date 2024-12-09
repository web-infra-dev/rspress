import type { ComponentProps } from 'react';

import clsx from '../../../utils/tailwind';

export const Table = (props: ComponentProps<'table'>) => {
  const { className, ...restProps } = props;

  return (
    <table
      {...restProps}
      className={clsx(
        'block border-collapse text-base my-5 overflow-x-auto leading-7 border-gray-light-3 dark:border-divider',
        className,
      )}
    />
  );
};

export const Tr = (props: ComponentProps<'tr'>) => {
  const { className, ...restProps } = props;

  return (
    <tr
      {...restProps}
      className={clsx(
        'border border-solid transition-colors duration-500 even:bg-soft border-gray-light-3 dark:border-divider',
        className,
      )}
    />
  );
};

export const Td = (props: ComponentProps<'td'>) => {
  const { className, ...restProps } = props;

  return (
    <td
      {...restProps}
      className={clsx(
        'border border-solid px-4 py-2 border-gray-light-3 dark:border-divider',
        className,
      )}
    />
  );
};

export const Th = (props: ComponentProps<'th'>) => {
  const { className, ...restProps } = props;

  return (
    <th
      {...restProps}
      className={clsx(
        'border border-solid px-4 py-2 text-text-1 text-base font-semibold border-gray-light-3 dark:border-divider',
        className,
      )}
    />
  );
};
