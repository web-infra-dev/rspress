import { normalizeImagePath } from '@rspress/core/runtime';
import type { ComponentProps } from 'react';
import { Image } from '@rspress/core/theme';

export const Img = (props: ComponentProps<'img'>) => {
  const preload = props.loading === 'eager' && props.fetchPriority !== 'low';
  return (
    <Image
      {...props}
      src={normalizeImagePath(props.src || '')}
      preload={preload}
    />
  );
};
