import { useLocation, useSearchParams } from '@rspress/core/runtime';
import clsx from 'clsx';
import {
  Children,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
} from 'react';
import './index.scss';

type PageTabItem = {
  label?: string | ReactNode;
  content?: ReactNode;
};

function getTabValuesFromChildren(
  children: ReactElement<PageTabProps>[],
): PageTabItem[] {
  return Children.map<PageTabItem, ReactElement<PageTabProps>>(
    children,
    (child, index) => {
      if (isValidElement(child)) {
        return {
          label: child.props?.label || undefined,
          content: children[index],
        } satisfies PageTabItem;
      }

      return {
        label: index,
        content: children[index],
      } satisfies PageTabItem;
    },
  );
}

export interface PageTabsProps {
  values?: ReactNode[] | ReadonlyArray<ReactNode> | PageTabItem[];
  /**
   * determine the query parameter name for the current tab
   * @default 'page''
   */
  id?: string;
  children: ReactNode;
  className?: string;
  tabPosition?: 'left' | 'center';
}

function usePageTabs(id: string, children: ReactElement<PageTabProps>[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search } = useLocation();

  const tabValues = useMemo(() => {
    return getTabValuesFromChildren(children);
  }, [children]);

  function navigateToTab(index: number) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (index === 0) {
      nextSearchParams.delete(id);
    } else {
      nextSearchParams.set(id, String(index));
    }
    setSearchParams(nextSearchParams);
  }

  useEffect(() => {
    const currIndex = Number(new URLSearchParams(search).get(id) ?? '0');
    if (!Number.isNaN(currIndex)) {
      document.body.dataset.pageTabsActiveIndex = currIndex.toString();
    }
  }, [id, search]);

  const injectScript = `(function () {
    var searchParams = new URLSearchParams(window.location.search);
    var currIndex = Number(searchParams.get('${id}') || 0);
    if (!Number.isNaN(currIndex)) {
      document.body.dataset.pageTabsActiveIndex = currIndex;
    }
  })();`;

  return {
    tabValues,
    navigateToTab,
    injectScript,
  };
}

export const PageTabs = forwardRef(
  (props: PageTabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      children: rawChildren,
      tabPosition = 'left',
      className,
      id = 'page',
    } = props;

    // remove "\n" character when write JSX element in multiple lines, use Children.toArray for Tabs with no Tab element
    const children = Children.toArray(rawChildren).filter(
      child =>
        !(typeof child === 'string' && child.trim() === '') &&
        isValidElement(child),
    ) as unknown as ReactElement<PageTabProps>[];

    const { tabValues, navigateToTab, injectScript } = usePageTabs(
      id,
      children,
    );

    if (import.meta.env.SSG_MD) {
      return (
        <>
          {tabValues.map(({ label, content }, index) => (
            <div key={index}>
              {label != null && (
                <p>
                  <strong>{label}</strong>
                </p>
              )}
              {content}
            </div>
          ))}
        </>
      );
    }

    return (
      <>
        {/* First screen during SSR */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: injectScript }}
        />
        <div className={clsx('rp-page-tabs', className)} ref={ref}>
          {tabValues.length ? (
            <div
              className="rp-page-tabs__label"
              style={{
                justifyContent:
                  tabPosition === 'center' ? 'center' : 'flex-start',
              }}
            >
              {tabValues.map(({ label }, index) => {
                return (
                  <div
                    key={typeof label === 'string' ? label : index}
                    className="rp-page-tabs__label__item"
                    data-index={index}
                    onClick={() => {
                      navigateToTab(index);
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="rp-page-tabs__content">
            {tabValues.map(({ label, content }, index) => {
              return (
                <div
                  key={typeof label === 'string' ? label : index}
                  className="rp-page-tabs__content__item"
                  data-index={index}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  },
);

export type PageTabProps = Pick<PageTabItem, 'label'> & {
  children?: ReactNode;
};

export function PageTab({ children }: PageTabProps): ReactElement {
  return <>{children}</>;
}
