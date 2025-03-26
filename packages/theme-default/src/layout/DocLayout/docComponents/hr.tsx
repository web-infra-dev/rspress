import type { ComponentProps } from 'react';

export const Hr = (props: ComponentProps<'hr'>) => {
  return (
    <hr
      {...props}
      className="rp-my-12 rp-border-t rp-border-solid rp-border-divider-light"
    />
  );
};
