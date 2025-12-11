import { useStorageValue } from '@theme';
import clsx from 'clsx';
import {
  Children,
  type ForwardedRef,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
  useState,
} from 'react';
import './index.scss';

type TabItem = {
  label?: string | ReactNode;
  disabled?: boolean;
  content?: ReactNode;
};

interface TabsProps {
  values?: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  /**
   * @default 0
   */
  defaultIndex?: number;
  onChange?: (index: number) => void;
  children: ReactNode;
  /**
   * If set, tabs with the same `groupId` will share the same active tab state via `localStorage`.
   * @default undefined
   */
  groupId?: string;
  tabPosition?: 'left' | 'center';
  /**
   * It is very useful during the transition animation and the first screen rendering of Static Site Generation (SSG).
   * @default true
   */
  keepDOM?: boolean;

  className?: string;
  labelItemClassName?: string;
  contentItemClassName?: string;
}

function getTabValuesFromChildren(
  children: ReactElement<TabProps>[],
  defaultValues: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[] | undefined,
): TabItem[] {
  // 0. only values, values contain label and content
  // <Tabs values={[{}, {}]}/>
  if (defaultValues?.every(item => isTabItem(item) && item.content)) {
    return defaultValues as TabItem[];
  }

  // 1. values only contain label
  // <Tabs values={['Tab1', 'Tab2']}><Tab label="Tab1"/></Tab><Tab label="Tab2"/></Tab></Tabs>
  if (defaultValues && defaultValues.length > 0) {
    return defaultValues.map((item, index) => {
      if (isTabItem(item)) {
        return item;
      }

      return {
        label: item,
        content: children[index],
      } satisfies TabItem;
    });
  }

  // 2. no values
  // <Tabs><Tab label="Tab1"/></Tab><Tab label="Tab2"/></Tab></Tabs>
  return Children.map<TabItem, ReactElement<TabProps>>(
    children,
    (child, index) => {
      if (isValidElement(child)) {
        return {
          label: child.props?.label || undefined,
          content: children[index],
        } satisfies TabItem;
      }

      return {
        label: index,
        content: children[index],
      } satisfies TabItem;
    },
  );
}

function isTabItem(item: unknown): item is TabItem {
  if (item && typeof item === 'object' && 'label' in item) {
    return true;
  }
  return false;
}

const groupIdPrefix = 'rspress.tabs.';

export const Tabs = forwardRef(
  (props: TabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      values,
      defaultIndex,
      onChange,
      children: rawChildren,
      groupId,
      tabPosition = 'left',
      className,
      labelItemClassName,
      contentItemClassName,
      keepDOM = true,
    } = props;
    // remove "\n" character when write JSX element in multiple lines, use Children.toArray for Tabs with no Tab element
    const children = Children.toArray(rawChildren).filter(
      child =>
        !(typeof child === 'string' && child.trim() === '') &&
        isValidElement(child),
    ) as unknown as ReactElement<TabProps>[];

    const tabValues: TabItem[] = useMemo(() => {
      return getTabValuesFromChildren(children, values);
    }, [values, children]);

    const [activeIndex, setActiveIndex] = useState(defaultIndex ?? 0);

    const [storageIndex, setStorageIndex] = useStorageValue<string>(
      `${groupIdPrefix}${groupId}`,
      activeIndex.toString(),
    );

    const currentIndex: number = groupId ? Number(storageIndex) : activeIndex;

    return (
      <div className={clsx('rp-tabs', className)} ref={ref}>
        {tabValues.length ? (
          <div
            className="rp-tabs__label rp-tabs__label--no-scrollbar"
            style={{
              justifyContent:
                tabPosition === 'center' ? 'center' : 'flex-start',
            }}
          >
            {tabValues.map(({ label }, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={typeof label === 'string' ? label : index}
                  className={clsx(
                    'rp-tabs__label__item',
                    isActive
                      ? 'rp-tabs__label__item--selected'
                      : 'rp-tabs__label__item--not-selected',
                    labelItemClassName,
                  )}
                  data-index={index}
                  onClick={() => {
                    onChange?.(index);
                    if (groupId) {
                      setStorageIndex(index.toString());
                    } else {
                      setActiveIndex(index);
                    }
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="rp-tabs__content">
          {tabValues.map(({ label, content }, index) => {
            const isActive = index === currentIndex;
            if (!keepDOM && !isActive) {
              return null;
            }

            return (
              <div
                key={typeof label === 'string' ? label : index}
                className={clsx(
                  'rp-tabs__content__item',
                  isActive
                    ? 'rp-tabs__content__item--active'
                    : 'rp-tabs__content__item--hidden',
                  contentItemClassName,
                )}
                aria-hidden={!isActive}
                data-index={index}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';

export type TabProps = Pick<TabItem, 'label' | 'disabled'> & {
  children: ReactNode;
};

export function Tab({ children }: TabProps): ReactElement {
  return <>{children}</>;
}
