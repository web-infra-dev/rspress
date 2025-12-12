import {
  IconArrowRight,
  IconFileTreeFile,
  IconFileTreeFolder,
  SvgWrapper,
} from '@theme';
import clsx from 'clsx';
import { useState } from 'react';
import './FileTree.scss';

export interface FileTreeItem {
  /**
   * Display text of the node.
   */
  name: string;
  /**
   * Optional link when the node represents a file.
   */
  href?: string;
  /**
   * Nested children, indicating the node is a folder.
   */
  children?: FileTreeItem[];
  /**
   * Whether the folder should be collapsed initially.
   */
  collapsed?: boolean;
}

export interface FileTreeProps {
  items: FileTreeItem[];
  className?: string;
}

export function FileTree({ items, className }: FileTreeProps) {
  return (
    <div className={clsx('rp-file-tree', className)} role="tree">
      {items.map(item => {
        const path = item.href ?? item.name;
        return <FileTreeNode key={path} item={item} depth={0} path={path} />;
      })}
    </div>
  );
}

function FileTreeNode({
  item,
  depth,
  path,
}: {
  item: FileTreeItem;
  depth: number;
  path: string;
}) {
  const hasChildren = Boolean(item.children?.length);
  const [collapsed, setCollapsed] = useState(Boolean(item.collapsed));
  const padding = `calc(12px + ${depth} * var(--rp-file-tree-indent))`;
  const isLinkLeaf = Boolean(!hasChildren && item.href);
  const Component = (isLinkLeaf ? 'a' : 'div') as 'div' | 'a';

  const toggleCollapse = () => {
    if (!hasChildren) {
      return;
    }
    setCollapsed(value => !value);
  };

  return (
    <div className="rp-file-tree__node">
      <Component
        className={clsx(
          'rp-file-tree__item',
          hasChildren
            ? 'rp-file-tree__item--folder'
            : 'rp-file-tree__item--file',
          collapsed && hasChildren && 'rp-file-tree__item--collapsed',
        )}
        style={{ paddingInlineStart: padding }}
        aria-expanded={hasChildren ? !collapsed : undefined}
        aria-level={depth + 1}
        role="treeitem"
        onClick={hasChildren ? toggleCollapse : undefined}
        onKeyDown={
          hasChildren
            ? event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleCollapse();
                }
              }
            : undefined
        }
        tabIndex={hasChildren ? 0 : isLinkLeaf ? undefined : -1}
        href={isLinkLeaf ? item.href : undefined}
      >
        {hasChildren ? (
          <span className="rp-file-tree__toggle">
            <SvgWrapper icon={IconArrowRight} />
          </span>
        ) : (
          <span className="rp-file-tree__spacer" />
        )}
        <span className="rp-file-tree__icon">
          <SvgWrapper
            icon={hasChildren ? IconFileTreeFolder : IconFileTreeFile}
          />
        </span>
        {isLinkLeaf ? (
          <span className="rp-file-tree__label rp-file-tree__label--link">
            {item.name}
          </span>
        ) : (
          <span className="rp-file-tree__label">{item.name}</span>
        )}
      </Component>

      {hasChildren && (
        <div
          className="rp-file-tree__children"
          style={{
            display: 'grid',
            gridTemplateRows: collapsed ? '0fr' : '1fr',
          }}
        >
          <div className="rp-file-tree__children-inner">
            {item.children?.map(child => (
              <FileTreeNode
                key={`${path}/${child.href ?? child.name}`}
                item={child}
                depth={depth + 1}
                path={`${path}/${child.href ?? child.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
