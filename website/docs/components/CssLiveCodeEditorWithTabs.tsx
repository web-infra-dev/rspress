import { useState } from 'react';
import { CssLiveCodeEditor } from './CssLiveCodeEditor';

export interface Tab {
  label: string;
  code: string;
}

export interface CssLiveCodeEditorWithTabsProps {
  tabs: Tab[];
  styleId?: string;
  initialCode?: string;
}

export function CssLiveCodeEditorWithTabs({
  tabs,
  styleId = 'live-css-editor-with-tabs-style',
  initialCode = '',
}: CssLiveCodeEditorWithTabsProps) {
  const [activeTab, setActiveTab] = useState(0); // 0 is custom tab
  const [customCode, setCustomCode] = useState(initialCode);

  const allTabs = [{ label: 'Custom', code: initialCode }, ...tabs];
  const shouldUseDropdown = allTabs.length > 6; // Use dropdown if more than 6 tabs

  const currentCode =
    activeTab === 0 ? customCode : tabs[activeTab - 1]?.code || '';
  const isCustomTab = activeTab === 0;

  const handleTabChange = (tabIndex: number) => {
    if (tabIndex === 0) {
      setCustomCode(initialCode);
    }
    setActiveTab(tabIndex);
  };

  const handleCodeChange = (code: string) => {
    if (isCustomTab) {
      setCustomCode(code);
    } else {
      setActiveTab(0);
      setCustomCode(code);
    }
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
              border: '1px solid #ccc',
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
                color: activeTab === index ? '#fff' : '#333',
                border:
                  activeTab === index
                    ? '1px solid var(--rp-c-brand)'
                    : '1px solid #ddd',
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
      <CssLiveCodeEditor
        value={currentCode}
        styleId={styleId}
        onChange={handleCodeChange}
      />
    </div>
  );
}
