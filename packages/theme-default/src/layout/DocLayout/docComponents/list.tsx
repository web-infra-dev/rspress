import type { ComponentProps } from 'react';

export const Ol = (props: ComponentProps<'ol'>) => {
  return (
    <ol {...props} className="rp-list-decimal rp-pl-5 rp-my-4 rp-leading-7" />
  );
};

export const Ul = (props: ComponentProps<'ul'>) => {
  return (
    <ul {...props} className="rp-list-disc rp-pl-5 rp-my-4 rp-leading-7" />
  );
};

export const Li = (props: ComponentProps<'li'>) => {
  return <li {...props} className="[&:not(:first-child)]:rp-mt-2" />;
};
