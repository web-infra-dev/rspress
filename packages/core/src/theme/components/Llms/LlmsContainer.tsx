import type React from 'react';
import './LlmsContainer.scss';

export interface LlmsContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function LlmsContainer(props: LlmsContainerProps) {
  return <div {...props} className={'rp-not-doc rp-llms-container'} />;
}
