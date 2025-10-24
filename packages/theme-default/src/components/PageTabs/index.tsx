import clsx from 'clsx';
import {
  Children,
  type ComponentPropsWithRef,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import './index.scss';
import { useLocation, useNavigate } from '@rspress/runtime';

type TabItem = {
  value?: string;
  label?: string | ReactNode;
  disabled?: boolean;
};

export interface PageTabsProps {
  values?: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  defaultValue?: string;
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

export const groupIdPrefix = 'rspress.tabs.';

let renderCountForTocUpdate = 0;

export const PageTabs = forwardRef(
  (props: PageTabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      values,
      defaultValue,
      children: rawChildren,
      tabPosition = 'left',
      tabContainerClassName,
    } = props;
    // remove "\n" character when write JSX element in multiple lines, use Children.toArray for Tabs with no Tab element
    const children = Children.toArray(rawChildren).filter(
      child => !(typeof child === 'string' && child.trim() === ''),
    ) as unknown as ReactElement<PageTabProps>[];

    const { search } = useLocation();
    const currentValue = useMemo(() => {
      const urlSearchParams = new URLSearchParams(search);
      return urlSearchParams.get('pageTabs');
    }, [search]);

    let tabValues = values || [];

    if (tabValues.length === 0) {
      tabValues = Children.map<TabItem, ReactElement<PageTabProps>>(
        children,
        child => {
          if (isValidElement(child)) {
            return {
              label: child.props?.label || undefined,
              value:
                child.props?.value ||
                (child.props?.label as string) ||
                undefined,
            };
          }

          return {
            label: undefined,
            value: undefined,
          };
        },
      );
    }

    const [activeIndex, setActiveIndex] = useState(() => {
      if (currentValue) {
        return tabValues.findIndex(item => {
          if (typeof item === 'string') {
            return item === currentValue;
          }
          if (item && typeof item === 'object' && 'value' in item) {
            return item.value === currentValue;
          }
          return false;
        });
      }
      if (defaultValue === undefined) {
        return 0;
      }

      return tabValues.findIndex(item => {
        if (typeof item === 'string') {
          return item === defaultValue;
        }
        if (item && typeof item === 'object' && 'value' in item) {
          return item.value === defaultValue;
        }
        return false;
      });
    });

    const currentIndex = activeIndex;
    const navigate = useNavigate();

    useEffect(() => {
      navigate({
        search: `?pageTabs=${tabValues[currentIndex] && typeof tabValues[currentIndex] === 'object' && isTabItem(tabValues[currentIndex]) ? (tabValues[currentIndex] as TabItem).value : tabValues[currentIndex]}`,
      });
    }, [currentIndex]);
    renderCountForTocUpdate++;

    return (
      <>
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
                      setActiveIndex(index);
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
