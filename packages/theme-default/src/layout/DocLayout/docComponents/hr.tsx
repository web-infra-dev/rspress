import type { ComponentProps } from 'react';

import clsx from '../../../utils/tailwind';

export const Hr = (props: ComponentProps<'hr'>) => {
  const { className, ...restProps } = props;

  return (
    <hr
      {...restProps}
      className={clsx(
        'my-12 border-t border-solid border-divider-light',
        className,
      )}
    />
  );
};
