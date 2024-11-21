import type { CodeProps } from './code';

import clsx from '../../../utils/tailwind';

const DEFAULT_LANGUAGE_CLASS = 'language-bash';

export interface PreProps {
  children: React.ReactElement[] | React.ReactElement;
  className?: string;
}

export function parseTitleFromMeta(meta: string): string {
  if (!meta) {
    return '';
  }
  let result = meta;
  const highlightReg = /{[\d,-]*}/i;
  const highlightMeta = highlightReg.exec(meta)?.[0];
  if (highlightMeta) {
    result = meta.replace(highlightReg, '').trim();
  }
  result = result.split('=')[1] ?? '';
  return result?.replace(/["'`]/g, '');
}

const renderChildren = (children: React.ReactElement) => {
  const { className, meta, ...restProps } = children.props as CodeProps;
  const codeTitle = parseTitleFromMeta(meta);
  return (
    <>
      {codeTitle && <div className="rspress-code-title">{codeTitle}</div>}
      <div
        {...restProps}
        className={clsx('rspress-code-content rspress-scrollbar', className)}
      >
        {children}
      </div>
    </>
  );
};

export function Pre({
  children,
  className = DEFAULT_LANGUAGE_CLASS,
}: PreProps) {
  if (Array.isArray(children)) {
    return (
      <div>
        {children.map((child, index) => (
          <div key={index} className={className}>
            {renderChildren(child)}
          </div>
        ))}
      </div>
    );
  }
  return <div className={className}>{renderChildren(children)}</div>;
}
