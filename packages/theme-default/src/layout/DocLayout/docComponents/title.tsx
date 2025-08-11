import type React from 'react';
import { h1Title, h2Title, h3Title, h4Title, title } from './title.module.scss';

export const H1 = (props: React.ComponentProps<'h1'>) => {
  return <h1 {...props} className={`rspress-doc-title ${h1Title} ${title}`} />;
};

export const H2 = (props: React.ComponentProps<'h2'>) => {
  return (
    <h2 {...props} className={`rspress-doc-outline ${h2Title} ${title}`} />
  );
};

export const H3 = (props: React.ComponentProps<'h3'>) => {
  return (
    <h3 {...props} className={`rspress-doc-outline ${h3Title} ${title}`} />
  );
};

export const H4 = (props: React.ComponentProps<'h4'>) => {
  return (
    <h4 {...props} className={`rspress-doc-outline ${h4Title} ${title}`} />
  );
};

export const H5 = (props: React.ComponentProps<'h5'>) => {
  return <h5 {...props} className={`rspress-doc-outline ${title}`} />;
};

export const H6 = (props: React.ComponentProps<'h6'>) => {
  return <h6 {...props} className={`rspress-doc-outline ${title}`} />;
};
