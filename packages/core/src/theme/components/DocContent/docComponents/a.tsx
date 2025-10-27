import { Link } from '@theme';
import type { ComponentProps } from 'react';

export const A = (props: ComponentProps<'a'>) => {
  return <Link {...props} />;
};
