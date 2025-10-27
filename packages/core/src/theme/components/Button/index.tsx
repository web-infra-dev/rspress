import { Link } from '@theme';
import clsx from 'clsx';
import React, { type JSX } from 'react';
import './index.scss';

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
      className: clsx(
        'rp-button',
        `rp-button--${theme}`,
        `rp-button--${size}`,
        className,
      ),
      href,
      ...dangerouslySetInnerHTML,
    },
    children,
  );
}
