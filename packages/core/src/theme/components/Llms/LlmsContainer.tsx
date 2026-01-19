import type React from 'react';
import styles from './LlmsContainer.module.scss';

export interface LlmsContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function LlmsContainer(props: LlmsContainerProps) {
  return <div {...props} className={`rp-not-doc ${styles.llmsContainer}`} />;
}
