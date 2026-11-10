import type React from 'react';
import './LlmsContainer.scss';

export type LlmsContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function LlmsContainer(props: LlmsContainerProps) {
  return <div {...props} className={'rp-not-doc rp-llms-container'} />;
}
