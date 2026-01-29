import {
  IconArrowRight,
  IconFileTreeFile,
  IconFileTreeFolder,
  SvgWrapper,
} from '@theme';
import clsx from 'clsx';
import type React from 'react';
import { useRef, useState } from 'react';
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

const buildPath = (
  base: string | undefined,
  index: number,
  item: FileTreeItem,
) => `${base ? `${base}/` : ''}${index}-${item.href ?? item.name}`;
const isSafeHref = (href?: string) =>
  typeof href === 'string' &&
  Boolean(href.trim()) &&
  !/^\s*(javascript:|data:|vbscript:|file:|about:)/i.test(
    href.trim().toLowerCase(),
  );

export function FileTree({ items, className }: FileTreeProps) {
  return (
    <div
      className={clsx('rp-file-tree', className)}
      role="tree"
      aria-label="File tree"
    >
      {items.map((item, index) => {
        const path = buildPath(undefined, index, item);
        return (
          <FileTreeNode
            key={path}
            item={item}
            depth={0}
            path={path}
            isFirst={index === 0}
          />
        );
      })}
    </div>
  );
}

function FileTreeNode({
  item,
  depth,
  path,
  isFirst,
}: {
  item: FileTreeItem;
  depth: number;
  path: string;
  isFirst: boolean;
}) {
  const hasChildren = Boolean(item.children?.length);
  const safeHref = isSafeHref(item.href) ? item.href : undefined;
  const [collapsed, setCollapsed] = useState(Boolean(item.collapsed));
  const padding = `calc(12px + ${depth} * var(--rp-file-tree-indent))`;
  const isLinkLeaf = Boolean(!hasChildren && safeHref);
  const itemRef = useRef<HTMLDivElement | HTMLAnchorElement>(null);

  const toggleCollapse = () => {
    if (!hasChildren) {
      return;
    }
    setCollapsed(value => !value);
  };

  const focusSibling = (direction: 1 | -1) => {
    const root = itemRef.current?.closest('.rp-file-tree');
    if (!root || !itemRef.current) {
      return;
    }
    const focusableItems = Array.from(
      root.querySelectorAll<HTMLElement>('[data-rp-file-tree-item="true"]'),
    );
    const currentIndex = focusableItems.indexOf(itemRef.current as HTMLElement);
    const target = focusableItems[currentIndex + direction];
    if (target) {
      target.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case 'ArrowRight':
        if (hasChildren && collapsed) {
          event.preventDefault();
          setCollapsed(false);
        }
        break;
      case 'ArrowLeft':
        if (hasChildren && !collapsed) {
          event.preventDefault();
          setCollapsed(true);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusSibling(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusSibling(-1);
        break;
      case 'Enter':
      case ' ':
        if (hasChildren) {
          event.preventDefault();
          toggleCollapse();
        }
        break;
      default:
        break;
    }
  };

  const sharedProps = {
    className: clsx(
      'rp-file-tree__item',
      hasChildren ? 'rp-file-tree__item--folder' : 'rp-file-tree__item--file',
      collapsed && hasChildren && 'rp-file-tree__item--collapsed',
    ),
    style: { paddingInlineStart: padding },
    'aria-expanded': hasChildren ? !collapsed : undefined,
    'aria-level': depth + 1,
    role: 'treeitem',
    onClick: hasChildren ? toggleCollapse : undefined,
    onKeyDown: handleKeyDown,
    tabIndex: isFirst ? 0 : -1,
    ref: itemRef,
    'data-rp-file-tree-item': true,
  };

  const itemContent = (
    <>
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
    </>
  );

  return (
    <div className="rp-file-tree__node">
      {isLinkLeaf ? (
        <a {...sharedProps} href={safeHref}>
          {itemContent}
        </a>
      ) : (
        <div {...sharedProps}>{itemContent}</div>
      )}

      {hasChildren && (
        <div
          className="rp-file-tree__children"
          style={{
            display: 'grid',
            gridTemplateRows: collapsed ? '0fr' : '1fr',
          }}
          aria-hidden={collapsed}
        >
          <div className="rp-file-tree__children-inner">
            {item.children?.map((child, childIndex) => {
              const childPath = buildPath(path, childIndex, child);
              return (
                <FileTreeNode
                  key={childPath}
                  item={child}
                  depth={depth + 1}
                  path={childPath}
                  isFirst={false}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
