import { useSearchParams } from '@rspress/core/runtime';
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

  const tabValues = useMemo(() => {
    return getTabValuesFromChildren(children);
  }, [children]);

  function navigateToTab(index: number) {
    if (index === 0) {
      searchParams.delete(id);
    } else {
      searchParams.set(id, String(index));
    }
    setSearchParams(searchParams);
  }

  useEffect(() => {
    const currIndex = Number(searchParams.get(id) ?? '0');
    if (!Number.isNaN(currIndex)) {
      document.body.dataset.pageTabsActiveIndex = currIndex.toString();
    }
  }, [searchParams]);

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

let renderCountForTocUpdate = 0;

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

    renderCountForTocUpdate++;

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
        {/* 
          Render a hidden <h2> element to trigger a Table of Contents (TOC) update.  
          This mechanism ensures that the TOC stays in sync with tab content changes,  
          as some TOC generators rely on heading elements being present in the DOM.  
        */}
        {renderCountForTocUpdate % 2 === 0 ? (
          <h2 style={{ display: 'none' }} />
        ) : null}
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
