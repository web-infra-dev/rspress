import type React from 'react';
import { llmsContainer } from './LlmsContainer.module.scss';
export function LlmsContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={llmsContainer} {...props}></div>;
}
