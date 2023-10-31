import { withBase } from '@rspress/runtime';
import { ComponentProps } from 'react';
import { isExternalHref } from '@/logic';

export const Img = (props: ComponentProps<'img'>) => {
  let { src = '' } = props;
  if (!isExternalHref(src)) {
    src = withBase(src);
  }
  return <img {...props} src={src} />;
};
