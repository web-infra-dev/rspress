import clsx from 'clsx';
import {
  Children,
  type CSSProperties,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import './index.scss';

interface FileEntry {
  id: string;
  path: string;
  label: string;
  segments: string[];
  fullTitle: string;
  element: ReactElement;
}

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  fileId?: string;
  children: TreeNode[];
}

export interface FileTreeProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function buildTree(entries: FileEntry[]): TreeNode[] {
  const root: TreeNode = {
    name: '',
    path: '',
    isFile: false,
    children: [],
  };

  entries.forEach(entry => {
    let current = root;
    entry.segments.forEach((segment, index) => {
      const isLast = index === entry.segments.length - 1;
      const nextPath = current.path ? `${current.path}/${segment}` : segment;
      let child = current.children.find(
        node => node.name === segment && node.isFile === isLast,
      );

      if (!child) {
        child = {
          name: segment,
          path: nextPath,
          isFile: isLast,
          fileId: isLast ? entry.id : undefined,
          children: [],
        };
        current.children.push(child);
      }

      if (isLast) {
        child.isFile = true;
        child.fileId = entry.id;
      }

      current = child;
    });
  });

  return root.children;
}

export function FileTree({ children, className, style }: FileTreeProps) {
  const entries = useMemo<FileEntry[]>(() => {
    const normalized: FileEntry[] = [];

    Children.forEach(children, (child, index) => {
      if (!isValidElement(child)) return;
      console.log(child.props, 111111);

      const { title: rawTitle } = (child.props as any).children?.props as {
        title?: string;
      };
      const trimmedTitle = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      const fallbackLabel = `File ${normalized.length + 1}`;
      const sourceForSegments = trimmedTitle || fallbackLabel;
      const segments = sourceForSegments
        .split('/')
        .map(segment => segment.trim())
        .filter(Boolean);

      if (!segments.length) {
        segments.push(fallbackLabel);
      }

      const path = segments.join('/');
      const label = segments[segments.length - 1];
      const fullTitle = trimmedTitle || path;

      normalized.push({
        id: String(index),
        path,
        label,
        segments,
        fullTitle,
        element: child,
      });
    });

    return normalized;
  }, [children]);

  const entryMap = useMemo(() => {
    return new Map(entries.map(entry => [entry.id, entry]));
  }, [entries]);

  const [activeId, setActiveId] = useState<string | undefined>(entries[0]?.id);

  useEffect(() => {
    if (!entries.length) {
      if (activeId !== undefined) {
        setActiveId(undefined);
      }
      return;
    }

    const hasActiveEntry = activeId
      ? entries.some(entry => entry.id === activeId)
      : false;

    if (!hasActiveEntry) {
      setActiveId(entries[0]?.id);
    }
  }, [entries, activeId]);

  const activeEntry = activeId ? entryMap.get(activeId) : undefined;
  const activePath = activeEntry?.path ?? '';
  const tree = useMemo(() => buildTree(entries), [entries]);

  const renderNodes = (nodes: TreeNode[]): ReactNode => {
    if (!nodes.length) return null;

    return (
      <ul className="rp-file-tree__list">
        {nodes.map(node => {
          const isActiveFile = node.isFile && node.fileId === activeId;
          const isActiveBranch =
            !node.isFile &&
            Boolean(activePath) &&
            (activePath === node.path ||
              activePath.startsWith(`${node.path}/`));

          if (node.isFile) {
            const entry = node.fileId ? entryMap.get(node.fileId) : undefined;
            return (
              <li key={node.path} className="rp-file-tree__item">
                <button
                  type="button"
                  className={clsx(
                    'rp-file-tree__file',
                    isActiveFile && 'rp-file-tree__file--active',
                  )}
                  onClick={() => {
                    if (node.fileId && node.fileId !== activeId) {
                      setActiveId(node.fileId);
                    }
                  }}
                  title={entry?.fullTitle ?? node.path}
                  aria-current={isActiveFile ? 'page' : undefined}
                >
                  {node.name}
                </button>
              </li>
            );
          }

          return (
            <li key={node.path} className="rp-file-tree__item">
              <div
                className={clsx(
                  'rp-file-tree__dir',
                  isActiveBranch && 'rp-file-tree__dir--active',
                )}
              >
                {node.name}
              </div>
              {renderNodes(node.children)}
            </li>
          );
        })}
      </ul>
    );
  };

  if (!entries.length) {
    return <>{children}</>;
  }

  const content = activeEntry
    ? cloneElement(activeEntry.element, { key: activeEntry.id })
    : null;

  return (
    <div className={clsx('rp-file-tree', className)} style={style}>
      <nav className="rp-file-tree__sidebar" aria-label="File navigation">
        {renderNodes(tree)}
      </nav>
      <div className="rp-file-tree__content">{content}</div>
    </div>
  );
}
