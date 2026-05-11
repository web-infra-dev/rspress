import { useStorageValue } from '@rspress/core/theme';
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
  label: ReactNode;
  value: string;
};

type ResolvedTabItem = {
  label?: ReactNode;
  value?: string;
  disabled?: boolean;
  content?: ReactNode;
};

export interface TabsProps {
  values?: ReadonlyArray<TabItem>;
  /**
   * @default 0
   */
  defaultIndex?: number;
  defaultValue?: string;
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
  defaultValues: ReadonlyArray<TabItem> | undefined,
): ResolvedTabItem[] {
  // 1. values contain label and value
  // <Tabs values={[{ label: 'Tab1', value: 'tab1' }]}><Tab value="tab1" /></Tabs>
  if (defaultValues && defaultValues.length > 0) {
    return defaultValues.map((item, index) => {
      const content =
        children.find(child => child.props?.value === item.value) ??
        children[index];

      return {
        ...item,
        content,
      } satisfies ResolvedTabItem;
    });
  }

  // 2. no values
  // <Tabs><Tab label="Tab1"/></Tab><Tab label="Tab2"/></Tab></Tabs>
  return Children.map<ResolvedTabItem, ReactElement<TabProps>>(
    children,
    (child, index) => {
      if (isValidElement(child)) {
        return {
          label: child.props?.label || undefined,
          value: child.props?.value,
          disabled: child.props?.disabled,
          content: children[index],
        } satisfies ResolvedTabItem;
      }

      return {
        label: index,
        content: children[index],
      } satisfies ResolvedTabItem;
    },
  );
}

const groupIdPrefix = 'rspress.tabs.';

export const Tabs = forwardRef(
  (props: TabsProps, ref: ForwardedRef<HTMLDivElement>): ReactElement => {
    const {
      values,
      defaultIndex,
      defaultValue,
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

    const tabValues: ResolvedTabItem[] = useMemo(() => {
      return getTabValuesFromChildren(children, values);
    }, [values, children]);

    if (process.env.__SSR_MD__) {
      return (
        <>
          {tabValues.map(({ label, content }) => {
            return (
              <>
                {`\n**${label}**\n\n`}
                {content}
                {`\n`}
              </>
            );
          })}
        </>
      );
    }

    const defaultActiveIndex =
      defaultValue !== undefined
        ? tabValues.findIndex(item => item.value === defaultValue)
        : -1;
    const initialActiveIndex =
      defaultActiveIndex === -1 ? (defaultIndex ?? 0) : defaultActiveIndex;

    const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

    const [storageIndex, setStorageIndex] = useStorageValue<string>(
      `${groupIdPrefix}${groupId}`,
      initialActiveIndex.toString(),
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
            {tabValues.map(({ label, value, disabled }, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={value ?? (typeof label === 'string' ? label : index)}
                  className={clsx(
                    'rp-tabs__label__item',
                    isActive
                      ? 'rp-tabs__label__item--selected'
                      : 'rp-tabs__label__item--not-selected',
                    labelItemClassName,
                  )}
                  data-index={index}
                  onClick={() => {
                    if (disabled) {
                      return;
                    }
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
          {tabValues.map(({ label, value, content }, index) => {
            const isActive = index === currentIndex;
            if (!keepDOM && !isActive) {
              return null;
            }

            return (
              <div
                key={value ?? (typeof label === 'string' ? label : index)}
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

export type TabProps = {
  label?: ReactNode;
  value?: string;
  disabled?: boolean;
  children: ReactNode;
};

export function Tab({ children }: TabProps): ReactElement {
  return <>{children}</>;
}
