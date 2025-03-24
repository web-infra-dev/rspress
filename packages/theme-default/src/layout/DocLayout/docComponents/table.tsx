import type { ComponentProps } from 'react';

export const Table = (props: ComponentProps<'table'>) => {
  return (
    <table
      {...props}
      className="rp-block rp-border-collapse rp-text-base rp-my-5 rp-overflow-x-auto rp-leading-7 rp-border-gray-light-3 dark:rp-border-divider"
    />
  );
};

export const Tr = (props: ComponentProps<'tr'>) => {
  return (
    <tr
      {...props}
      className="rp-border rp-border-solid rp-transition-colors rp-duration-500 even:rp-bg-soft rp-border-gray-light-3 dark:rp-border-divider"
    />
  );
};

export const Td = (props: ComponentProps<'td'>) => {
  return (
    <td
      {...props}
      className="rp-border rp-border-solid rp-px-4 rp-py-2 rp-border-gray-light-3 dark:rp-border-divider"
    />
  );
};

export const Th = (props: ComponentProps<'th'>) => {
  return (
    <th
      {...props}
      className="rp-border rp-border-solid rp-px-4 rp-py-2 rp-text-text-1 rp-text-base rp-font-semibold rp-border-gray-light-3 dark:rp-border-divider"
    />
  );
};
