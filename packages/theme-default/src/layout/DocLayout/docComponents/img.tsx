import { normalizeImagePath } from '@rspress/runtime';
import { ComponentProps } from 'react';

export const Img = (props: ComponentProps<'img'>) => {
  return <img {...props} src={normalizeImagePath(props.src || '')} />;
};
