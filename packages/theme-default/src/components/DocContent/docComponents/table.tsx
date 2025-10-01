import type { ComponentProps } from 'react';

export const Table = (props: ComponentProps<'table'>) => {
  return <table {...props} />;
};

export const Tr = (props: ComponentProps<'tr'>) => {
  return <tr {...props} />;
};

export const Td = (props: ComponentProps<'td'>) => {
  return <td {...props} />;
};

export const Th = (props: ComponentProps<'th'>) => {
  return <th {...props} />;
};
