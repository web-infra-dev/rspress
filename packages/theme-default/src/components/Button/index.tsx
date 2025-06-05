import { Link } from '@theme';
import React from 'react';
import * as styles from './index.module.scss';

interface ButtonProps {
  type?: string;
  size?: 'medium' | 'big';
  theme?: 'brand' | 'alt';
  href?: string;
  external?: boolean;
  className?: string;
  children?: React.ReactNode;
  dangerouslySetInnerHTML?: {
    __html: string;
  };
}

export function Button(props: ButtonProps) {
  const {
    theme = 'brand',
    size = 'big',
    href = '/',
    external = false,
    className = '',
    children,
    dangerouslySetInnerHTML,
  } = props;
  let type: string | typeof Link | null = null;

  if (props.type === 'button') {
    type = 'button';
  } else if (props.type === 'a') {
    // Will be tree shaking in production in modern mode.
    type = external ? 'a' : Link;
  }

  return React.createElement(
    type ?? 'a',
    {
      className: `${styles.button} ${styles[theme]} ${styles[size]} ${className}`,
      href,
      ...(dangerouslySetInnerHTML ?? {}),
    },
    children,
  );
}
