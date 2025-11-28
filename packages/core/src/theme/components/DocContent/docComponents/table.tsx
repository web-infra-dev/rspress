import { type ComponentProps, forwardRef } from 'react';
import { PREFIX } from '../../../constant';

export const Table = forwardRef<HTMLTableElement, ComponentProps<'table'>>(
  (props, ref) => {
    return (
      <div className={`${PREFIX}table-scroll-container ${PREFIX}scrollbar`}>
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
