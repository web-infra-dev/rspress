import type { ComponentProps } from 'react';

export const Ol = (props: ComponentProps<'ol'>) => {
  return <ol {...props} />;
};

export const Ul = (props: ComponentProps<'ul'>) => {
  return <ul {...props} />;
};

export const Li = (props: ComponentProps<'li'>) => {
  return <li {...props} />;
};
