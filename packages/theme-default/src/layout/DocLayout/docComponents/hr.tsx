import type { ComponentProps } from 'react';

export const Hr = (props: ComponentProps<'hr'>) => {
  return (
    <hr
      {...props}
      className="my-12 border-t border-solid border-divider-light"
    />
  );
};
