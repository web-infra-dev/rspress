import type { ReactNode } from 'react';
import './index.scss';

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
 * <div class="rspress-directive tip">
 *   <div class="rspress-directive-title">Tip</div>
 *   <div class="rspress-directive-content">
 *     <p>This is a tip</p>
 *   </div>
 * </div>
 */
export function Callout({ type, title, children }: CalloutProps) {
  const isDetails = type === 'details';

  if (isDetails) {
    return (
      <details className={`rspress-directive ${type}`}>
        <summary className="rspress-directive-title">{title}</summary>
        <div className="rspress-directive-content">{children}</div>
      </details>
    );
  }

  return (
    <div className={`rspress-directive ${type}`}>
      <div className="rspress-directive-title">{title}</div>
      <div className="rspress-directive-content">{children}</div>
    </div>
  );
}

export default Callout;
