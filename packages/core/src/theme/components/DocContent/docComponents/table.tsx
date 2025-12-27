import clsx from 'clsx';
import { type ComponentProps, forwardRef } from 'react';

/**
 * Table component with a scrollable container.
 *
 * Usage:
 *
 * ```tsx
 * <Table>
 *   <tr>
 *     <th>Header 1</th>
 *     <th>Header 2</th>
 *   </tr>
 *  <tr>
 *    <td>Data 1</td>
 *   <td>Data 2</td>
 * </tr>
 * </Table>
 * ```
 */
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
