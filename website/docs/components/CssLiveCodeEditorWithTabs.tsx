import { useEffect, useRef, useState } from 'react';
import { useCssModification } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface Tab {
  label: string;
  code: string;
}

export interface CssLiveCodeEditorWithTabsProps {
  tabs: Tab[];
  styleId: string; // Required - unique ID for this editor
  initialCode: string; // Required - the default CSS value
}

export function CssLiveCodeEditorWithTabs({
  tabs,
  styleId,
  initialCode,
}: CssLiveCodeEditorWithTabsProps) {
  const { register, updateValue, getEntry } = useCssModification();

  // Register or get existing entry on mount
  const entryRef = useRef<{
    defaultValue: string;
    currentValue: string;
  } | null>(null);
  if (!entryRef.current) {
    entryRef.current = register(styleId, initialCode);
  }

  // Determine initial tab based on current value
  const getInitialTab = (currentValue: string): number => {
    const matchingTabIndex = tabs.findIndex(tab => tab.code === currentValue);
    if (matchingTabIndex !== -1) {
      return matchingTabIndex + 1;
    }
    return 0; // Custom tab
  };

  const [activeTab, setActiveTab] = useState(() =>
    getInitialTab(entryRef.current!.currentValue),
  );
  const [customCode, setCustomCode] = useState(() =>
    activeTab === 0 ? entryRef.current!.currentValue : initialCode,
  );

  const allTabs = [{ label: 'Custom', code: initialCode }, ...tabs];
  const shouldUseDropdown = allTabs.length > 6;

  const currentCode =
    activeTab === 0 ? customCode : tabs[activeTab - 1]?.code || '';

  // Update context when currentCode changes
  useEffect(() => {
    updateValue(styleId, currentCode);
  }, [currentCode, styleId, updateValue]);

  // Sync from context when re-entering page
  useEffect(() => {
    const entry = getEntry(styleId);
    if (entry && entry.currentValue !== currentCode) {
      const newTab = getInitialTab(entry.currentValue);
      setActiveTab(newTab);
      if (newTab === 0) {
        setCustomCode(entry.currentValue);
      }
    }
  }, [styleId, getEntry]);

  const handleTabChange = (tabIndex: number) => {
    if (tabIndex === 0) {
      setCustomCode(initialCode);
    }
    setActiveTab(tabIndex);
  };

  const handleCodeChange = (code: string) => {
    setActiveTab(0);
    setCustomCode(code);
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
      <LiveCodeEditor
        lang="css"
        value={currentCode}
        onChange={handleCodeChange}
      />
    </div>
  );
}
