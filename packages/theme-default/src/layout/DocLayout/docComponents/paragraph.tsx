import type { ComponentProps } from 'react';
import * as styles from './paragraph.module.scss';

export const P = (props: ComponentProps<'p'>) => {
  return <p {...props} className={styles.paragraph} />;
};

export const Blockquote = (props: ComponentProps<'blockquote'>) => {
  return (
    <blockquote
      {...props}
      className={`rp-border-l-2 rp-border-solid rp-border-divider rp-pl-4 rp-my-6 rp-transition-colors rp-duration-500 ${styles.blockquote}`}
    />
  );
};

export const Strong = (props: ComponentProps<'strong'>) => {
  return <strong {...props} className="rp-font-semibold" />;
};
