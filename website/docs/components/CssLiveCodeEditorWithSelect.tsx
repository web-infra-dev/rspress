import { useEffect, useState } from 'react';
import { useCssEntry } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

export interface SelectOption {
  label: string;
  code: string;
}

export interface CssLiveCodeEditorWithSelectProps {
  options: SelectOption[];
  styleId: string;
  initialCode: string;
}

export function CssLiveCodeEditorWithSelect({
  options,
  styleId,
  initialCode,
}: CssLiveCodeEditorWithSelectProps) {
  const [value, setValue] = useCssEntry(styleId, initialCode);

  // Determine active option based on current value
  const getOptionIndex = (code: string): number => {
    const idx = options.findIndex(opt => opt.code === code);
    return idx !== -1 ? idx + 1 : 0; // 0 = Default/Custom
  };

  const [activeOption, setActiveOption] = useState(() => getOptionIndex(value));

  // Sync activeOption when value changes externally (e.g., reset)
  useEffect(() => {
    const newOption = getOptionIndex(value);
    setActiveOption(prev => (prev !== newOption ? newOption : prev));
  }, [value, options]);

  // Show "Default" when code matches initialCode, "Custom" when modified
  const isCustomized = activeOption === 0 && value !== initialCode;
  const firstOptionLabel = isCustomized ? 'Custom' : 'Default';
  const allOptions = [
    { label: firstOptionLabel, code: initialCode },
    ...options,
  ];

  const handleSelectChange = (optionIndex: number) => {
    setActiveOption(optionIndex);
    if (optionIndex === 0) {
      setValue(initialCode);
    } else {
      setValue(options[optionIndex - 1].code);
    }
  };

  const handleCodeChange = (code: string) => {
    setActiveOption(0);
    setValue(code);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select
          value={activeOption}
          onChange={e => handleSelectChange(Number(e.target.value))}
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
          {allOptions.map((opt, index) => (
            <option key={index} value={index}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <LiveCodeEditor lang="css" value={value} onChange={handleCodeChange} />
    </div>
  );
}
