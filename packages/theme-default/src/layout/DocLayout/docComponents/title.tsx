import type React from 'react';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  const { className, ...rest } = props;
  return <h1 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  const { className, ...rest } = props;
  return <h2 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  const { className, ...rest } = props;
  return <h3 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  const { className, ...rest } = props;
  return <h4 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  const { className, ...rest } = props;
  return <h5 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  const { className, ...rest } = props;
  return <h6 className={`rspress-doc-outline ${className || ''}`} {...rest} />;
};
