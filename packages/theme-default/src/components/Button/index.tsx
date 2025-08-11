import { Link } from '@theme';
import React, { type JSX } from 'react';
import * as styles from './index.module.scss';

interface ButtonProps {
  type?: string;
  size?: 'medium' | 'big';
  theme?: 'brand' | 'alt';
  href?: string;
  className?: string;
  children?: React.ReactNode;
  dangerouslySetInnerHTML?: {
    __html: string;
  };
}

export function Button(props: ButtonProps): JSX.Element {
  const {
    theme = 'brand',
    size = 'big',
    href = '/',
    className = '',
    children,
    dangerouslySetInnerHTML,
  } = props;
  let type: string | typeof Link | null = null;

  if (props.type === 'button') {
    type = 'button';
  } else if (props.type === 'a') {
    type = Link;
  }

  return React.createElement(
    type ?? 'a',
    {
      className: `${styles.button} ${styles[theme]} ${styles[size]} ${className}`,
      href,
      ...dangerouslySetInnerHTML,
    },
    children,
  );
}
