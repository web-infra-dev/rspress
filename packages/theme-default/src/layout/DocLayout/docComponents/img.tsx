import { normalizeImagePath } from '@rspress/runtime';
import type { ComponentProps } from 'react';

export const Img = (props: ComponentProps<'img'>) => {
  return <img {...props} src={normalizeImagePath(props.src || '')} />;
};
