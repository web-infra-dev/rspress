import type { ComponentProps } from 'react';

export const P = (props: ComponentProps<'p'>) => {
  return <p {...props} />;
};

export const Blockquote = (props: ComponentProps<'blockquote'>) => {
  return <blockquote {...props} />;
};

export const Strong = (props: ComponentProps<'strong'>) => {
  return <strong {...props} />;
};
