import type { ComponentProps } from 'react';

export interface LinkProps extends ComponentProps<'a'> {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  onMouseEnter?: (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => void;
}
