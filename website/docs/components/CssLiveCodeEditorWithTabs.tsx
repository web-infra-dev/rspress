import { useEffect, useState } from 'react';
import { useCssEntry } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface Tab {
  label: string;
  code: string;
}

export interface CssLiveCodeEditorWithTabsProps {
  tabs: Tab[];
  styleId: string;
  initialCode: string;
}

export function CssLiveCodeEditorWithTabs({
  tabs,
  styleId,
  initialCode,
}: CssLiveCodeEditorWithTabsProps) {
  const [value, setValue] = useCssEntry(styleId, initialCode);

  // Determine active tab based on current value
  const getTabIndex = (code: string): number => {
    const idx = tabs.findIndex(tab => tab.code === code);
    return idx !== -1 ? idx + 1 : 0; // 0 = Custom tab
  };

  const [activeTab, setActiveTab] = useState(() => getTabIndex(value));

  // Sync activeTab when value changes externally (e.g., reset)
  useEffect(() => {
    const newTab = getTabIndex(value);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [value]);

  // Show "Default" when code matches initialCode, "Custom" when modified
  const isCustomized = activeTab === 0 && value !== initialCode;
  const firstTabLabel = isCustomized ? 'Custom' : 'Default';
  const allTabs = [{ label: firstTabLabel, code: initialCode }, ...tabs];
  const shouldUseDropdown = allTabs.length > 6;

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (tabIndex === 0) {
      setValue(initialCode);
    } else {
      setValue(tabs[tabIndex - 1].code);
    }
  };

  const handleCodeChange = (code: string) => {
    setActiveTab(0);
    setValue(code);
  };

  return (
    <div>
      {/* Tabs or Dropdown */}
      {shouldUseDropdown ? (
        <div style={{ marginBottom: 16 }}>
          <select
            value={activeTab}
            onChange={e => handleTabChange(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--rp-c-divider-light)',
              borderRadius: '4px',
              backgroundColor: 'var(--rp-c-bg)',
              color: 'var(--rp-c-text-1)',
              cursor: 'pointer',
              fontSize: '14px',
              minWidth: '200px',
            }}
          >
            {allTabs.map((tab, index) => (
              <option key={index} value={index}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: 16,
          }}
        >
          {allTabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  activeTab === index
                    ? index === 0
                      ? '#0095ff'
                      : 'var(--rp-c-brand)'
                    : 'var(--rp-c-bg)',
                color: activeTab === index ? '#fff' : 'var(--rp-c-text-1)',
                border: '1px solid var(--rp-c-divider-light)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === index ? '500' : '400',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                outline: 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* CSS Editor */}
      <LiveCodeEditor lang="css" value={value} onChange={handleCodeChange} />
    </div>
  );
}
