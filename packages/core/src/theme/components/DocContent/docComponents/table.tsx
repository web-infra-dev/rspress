import { type ComponentProps, forwardRef } from 'react';

export const Table = forwardRef<HTMLTableElement, ComponentProps<'table'>>(
  (props, ref) => {
    return (
      <div className="rp-table-scroll-container rp-scrollbar">
        <table ref={ref} {...props} />
      </div>
    );
  },
);

export const Tr = (props: ComponentProps<'tr'>) => {
  return <tr {...props} />;
};

export const Td = (props: ComponentProps<'td'>) => {
  return <td {...props} />;
};

export const Th = (props: ComponentProps<'th'>) => {
  return <th {...props} />;
};
