import { useLocation, useNavigate } from '@rspress/runtime';
import clsx from 'clsx';
import {
  Children,
  type ComponentPropsWithRef,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react';
import './index.scss';

type TabItem = {
  value?: string;
  label?: string | ReactNode;
};

function getTabValuesFromChildren(
  children: ReactElement<PageTabProps>[],
): TabItem[] {
  return Children.map<TabItem, ReactElement<PageTabProps>>(children, child => {
    if (isValidElement(child)) {
      return {
        label: child.props?.label || undefined,
        value:
          child.props?.value || (child.props?.label as string) || undefined,
      };
    }

    return {
      label: undefined,
      value: undefined,
    };
  });
}

export interface PageTabsProps {
  values?: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  /**
   * @default 'page''
   */
  id?: string;
  children: ReactNode;
  tabContainerClassName?: string;
  tabPosition?: 'left' | 'center';
}

function isTabItem(item: unknown): item is TabItem {
  if (item && typeof item === 'object' && 'label' in item) {
    return true;
  }
  return false;
}

const renderTab = (item: ReactNode | TabItem) => {
  if (isTabItem(item)) {
    return item.label || item.value;
  }
  return item;
};

function usePageTabs(id: string, rawChildren: ReactNode) {
  // remove "\n" character when write JSX element in multiple lines, use Children.toArray for Tabs with no Tab element
  const children = Children.toArray(rawChildren).filter(
    child => !(typeof child === 'string' && child.trim() === ''),
  ) as unknown as ReactElement<PageTabProps>[];
  const navigate = useNavigate();

  const tabValues = useMemo(() => {
    return getTabValuesFromChildren(children);
  }, [rawChildren]);

  const { search } = useLocation();

  function navigateToTab(index: number) {
    const urlSearchParams = new URLSearchParams(search);
    if (index === 0) {
      urlSearchParams.delete(id);
    } else {
      urlSearchParams.set(id, String(index));
    }
    navigate({
      search: urlSearchParams.toString(),
    });
  }

  const currentIndex = Number(new URLSearchParams(search).get(id)) || 0;

  return {
    children,
    currentIndex,
    tabValues,
    navigateToTab,
  };
}

let renderCountForTocUpdate = 0;

export const PageTabs = forwardRef(
  (props: PageTabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      children: rawChildren,
      tabPosition = 'left',
      tabContainerClassName,
      id = 'page',
    } = props;

    const { children, currentIndex, tabValues, navigateToTab } = usePageTabs(
      id,
      rawChildren,
    );

    renderCountForTocUpdate++;

    return (
      <>
        {/* <script>{`window.addEventLi`}</script> */}
        <div className={clsx('rp-page-tabs', tabContainerClassName)} ref={ref}>
          {tabValues.length ? (
            <div
              className="rp-page-tabs__label"
              style={{
                justifyContent:
                  tabPosition === 'center' ? 'center' : 'flex-start',
              }}
            >
              {tabValues.map((item, index) => {
                return (
                  <div
                    key={index}
                    className={clsx(
                      'rp-page-tabs__label__item',
                      currentIndex === index
                        ? 'rp-page-tabs__label__item--selected'
                        : 'rp-page-tabs__label__item--not-selected',
                    )}
                    onClick={() => {
                      if (item.value) {
                        navigateToTab(index);
                      }
                    }}
                  >
                    {renderTab(item)}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="rp-page-tabs__content">
            {Children.map(children, (child, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  className={clsx(
                    'rp-page-tabs__content__item',
                    isActive
                      ? 'rp-page-tabs__content__item--active'
                      : 'rp-page-tabs__content__item--hidden',
                  )}
                  aria-hidden={!isActive}
                  data-index={index}
                  key={index}
                >
                  {child}
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

export type PageTabProps = ComponentPropsWithRef<'div'> &
  Pick<TabItem, 'label' | 'value'>;

export function PageTab({ children }: PageTabProps): ReactElement {
  return <>{children}</>;
}
