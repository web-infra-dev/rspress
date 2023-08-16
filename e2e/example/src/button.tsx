import React from 'react';

export type ButtonProps = {
  /**
   * Whether to disable the button
   */
  disabled?: boolean;
  /**
   * Type of Button
   * @default 'default'
   */
  size?: 'mini' | 'small' | 'default' | 'large';
};
export const ButtonTest = (props?: ButtonProps) => {};
