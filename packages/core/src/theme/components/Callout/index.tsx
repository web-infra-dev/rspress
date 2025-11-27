import type { ReactNode } from 'react';
import './index.scss';
import { PREFIX } from '../../constant';

export interface CalloutProps {
  type: 'tip' | 'note' | 'warning' | 'caution' | 'danger' | 'info' | 'details';
  title?: string;
  children: ReactNode;
}

/**
 * Construct the DOM structure of the container directive.
 * For example:
 *
 * ::: tip {title="foo"}
 * This is a tip
 * :::
 *
 * will be transformed to:
 *
 * <div class="rp-callout rp-callout--tip">
 *   <div class="rp-callout__title">Tip</div>
 *   <div class="rp-callout__content">
 *     <p>This is a tip</p>
 *   </div>
 * </div>
 */
export function Callout({ type, title, children }: CalloutProps): ReactNode {
  const isDetails = type === 'details';

  if (isDetails) {
    return (
      <details className={`${PREFIX}callout ${PREFIX}callout--${type}`}>
        <summary className={`${PREFIX}callout__title`}>{title}</summary>
        <div className={`${PREFIX}callout__content`}>{children}</div>
      </details>
    );
  }

  return (
    <div className={`${PREFIX}callout ${PREFIX}callout--${type}`}>
      <div className={`${PREFIX}callout__title`}>{title}</div>
      <div className={`${PREFIX}callout__content`}>{children}</div>
    </div>
  );
}

export default Callout;
