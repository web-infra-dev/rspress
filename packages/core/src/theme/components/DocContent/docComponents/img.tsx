import { normalizeImagePath } from '@rspress/core/runtime';
import type { ComponentProps } from 'react';

export const Img = (props: ComponentProps<'img'>) => {
  return (
    <img
      {...props}
      alt={props.alt ?? ''}
      src={normalizeImagePath(props.src || '')}
    />
  );
};
