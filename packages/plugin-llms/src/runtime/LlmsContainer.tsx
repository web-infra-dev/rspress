import type React from 'react';
import { llmsContainer } from './LlmsContainer.module.scss';

export interface LlmsContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}
export function LlmsContainer(props: LlmsContainerProps) {
  return <div {...props} className={llmsContainer}></div>;
}
