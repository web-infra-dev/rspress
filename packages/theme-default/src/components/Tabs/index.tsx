import {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
  useContext,
  useState,
  forwardRef,
  type ForwardRefExoticComponent,
  ForwardedRef,
} from 'react';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';

type TabItem = {
  value?: string;
  label?: string | ReactNode;
  disabled?: boolean;
};

interface TabsProps {
  values: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  defaultValue?: string;
  onChange?: (index: number) => void;
  children: ReactNode;
  groupId?: string;
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

export const Tabs: ForwardRefExoticComponent<TabsProps> = forwardRef(
  (props: TabsProps, ref: ForwardedRef<any>): ReactElement => {
    const {
      values,
      defaultValue,
      onChange,
      children,
      groupId,
      tabPosition = 'left',
      tabContainerClassName,
    } = props;
    let tabValues = values || [];
    if (tabValues.length === 0) {
      tabValues = (children as ReactElement[]).map(child => ({
        label: child.props?.label,
        value: child.props?.value || child.props?.label,
      }));
    }
    const { tabData, setTabData } = useContext(TabDataContext);
    let defaultIndex = 0;
    const needSync = groupId && tabData[groupId] !== undefined;
    if (needSync) {
      defaultIndex = tabData[groupId];
    } else if (defaultValue) {
      defaultIndex = tabValues.findIndex(item => {
        if (typeof item === 'string') {
          return item === defaultValue;
        }
        if (item && typeof item === 'object' && 'value' in item) {
          return item.value === defaultValue;
        }
        return false;
      });
    }
    const [activeIndex, setActiveIndex] = useState(defaultIndex);

    return (
      <div className={styles.container} ref={ref}>
        <div className={tabContainerClassName}>
          {tabValues.length ? (
            <div
              className={`${styles.tabList} ${styles.noScrollbar}`}
              style={{
                justifyContent:
                  tabPosition === 'center' ? 'center' : 'flex-start',
              }}
            >
              {tabValues.map((item, index) => {
                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className={`${styles.tab} ${
                      activeIndex === index
                        ? styles.selected
                        : styles.notSelected
                    }`}
                    onClick={() => {
                      onChange?.(index);
                      setActiveIndex(index);
                      if (groupId) {
                        setTabData({ ...tabData, [groupId]: index });
                      }
                    }}
                  >
                    {renderTab(item)}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        <div>{children[activeIndex]}</div>
      </div>
    );
  },
);

export function Tab({
  children,
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return (
    <div {...props} className="rounded px-2">
      {children}
    </div>
  );
}
