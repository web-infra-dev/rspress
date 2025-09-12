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
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 16 }}>
        {allTabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabChange(index)}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === index ? '#e0e0e0' : 'transparent',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CSS Editor */}
      <CssLiveCodeEditor
        value={currentCode}
        styleId={styleId}
        onChange={handleCodeChange}
      />
    </div>
  );
}
