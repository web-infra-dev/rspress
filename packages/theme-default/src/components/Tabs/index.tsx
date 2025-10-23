import clsx from 'clsx';
import {
  Children,
  type ComponentPropsWithRef,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TabDataContext } from '../../logic/TabDataContext';
import { useStorageValue } from '../../logic/useStorageValue';
import './index.scss';

type TabItem = {
  value?: string;
  label?: string | ReactNode;
  disabled?: boolean;
};

interface TabsProps {
  values?: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  defaultValue?: string;
  onChange?: (index: number) => void;
  children: ReactNode;
  groupId?: string;
  tabContainerClassName?: string;
  tabPosition?: 'left' | 'center';
  /**
   * It is very useful during the transition animation and the first screen rendering of Static Site Generation (SSG).
   * @default true
   */
  keepDOM?: boolean;
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

export const Tabs = forwardRef(
  (props: TabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      values,
      defaultValue,
      onChange,
      children: rawChildren,
      groupId,
      tabPosition = 'left',
      tabContainerClassName,
      keepDOM = false,
    } = props;
    // remove "\n" character when write JSX element in multiple lines, use Children.toArray for Tabs with no Tab element
    const children = Children.toArray(rawChildren).filter(
      child => !(typeof child === 'string' && child.trim() === ''),
    ) as unknown as ReactElement<TabProps>[];

    let tabValues = values || [];

    if (tabValues.length === 0) {
      tabValues = Children.map<TabItem, ReactElement<TabProps>>(
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

    const { tabData, setTabData } = useContext(TabDataContext);
    const [activeIndex, setActiveIndex] = useState(() => {
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

    const [storageIndex, setStorageIndex] = useStorageValue<string>(
      `${groupIdPrefix}${groupId}`,
      activeIndex.toString(),
    );

    const syncIndex = useMemo(() => {
      if (groupId) {
        if (tabData[groupId] !== undefined) {
          return tabData[groupId];
        }

        return Number.parseInt(storageIndex, 10);
      }

      return activeIndex;
    }, [groupId && tabData[groupId]]);

    // sync when other browser page trigger update
    useEffect(() => {
      if (groupId) {
        const correctIndex = Number.parseInt(storageIndex, 10);

        if (syncIndex !== correctIndex) {
          setTabData({ ...tabData, [groupId]: correctIndex });
        }
      }
    }, [storageIndex]);

    const currentIndex = groupId ? syncIndex : activeIndex;

    return (
      <div className={clsx('rp-tabs', tabContainerClassName)} ref={ref}>
        {tabValues.length ? (
          <div
            className="rp-tabs__label rp-tabs__label--no-scrollbar"
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
                    'rp-tabs__label__item',
                    currentIndex === index
                      ? 'rp-tabs__label__item--selected'
                      : 'rp-tabs__label__item--not-selected',
                  )}
                  onClick={() => {
                    onChange?.(index);
                    if (groupId) {
                      setTabData({ ...tabData, [groupId]: index });
                      setStorageIndex(index.toString());
                    } else {
                      setActiveIndex(index);
                    }
                  }}
                >
                  {renderTab(item)}
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="rp-tabs__content">
          {Children.map(children, (child, index) => {
            const isActive = index === currentIndex;
            if (!keepDOM && !isActive) {
              return null;
            }

            return (
              <div
                className={clsx(
                  'rp-tabs__content__item',
                  isActive
                    ? 'rp-tabs__content__item--active'
                    : 'rp-tabs__content__item--hidden',
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
    );
  },
);

export type TabProps = ComponentPropsWithRef<'div'> &
  Pick<TabItem, 'label' | 'value'>;

export function Tab({ children, ...props }: TabProps): ReactElement {
  return (
    <div {...props} className="rp-tab">
      {children}
    </div>
  );
}
