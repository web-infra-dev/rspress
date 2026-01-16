import { useEffect, useRef, useState } from 'react';
import INITIAL_CONTENT from '../../../packages/core/src/theme/styles/vars/brand-vars.css?raw';
import { useCssEntry } from './CssModificationContext';
import { LiveCodeEditor } from './LiveCodeEditor';

function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): T {
  const timerRef = useRef<number | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return ((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fnRef.current(...args), delay);
  }) as T;
}

// Predefined colors
const PREDEFINED_COLORS = [
  { label: 'Red', color: '#FF0000' },
  { label: 'Orange', color: '#FFA500' },
  { label: 'Blue', color: '#0095FF' },
  { label: 'Green', color: '#00AA55' },
];

function hslString(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)}deg ${Math.round(s)}% ${Math.round(l)}%)`;
}

function hexToHsl(hex: string) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function adjustLightness(hex: string, delta: number) {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.max(0, Math.min(100, l + delta));
  return {
    hex: hslToHex(h, s, newL),
    hsl: hslString(h, s, newL),
  };
}

function adjustAlpha(hex: string, alpha: number) {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBrandColors(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  return {
    brand: { hex, hsl: hslString(h, s, l) },
    brandDark: adjustLightness(hex, -5),
    brandDarker: adjustLightness(hex, -10),
    brandLight: adjustLightness(hex, 10),
    brandLighter: adjustLightness(hex, 20),
    brandTint: { rgba: adjustAlpha(hex, 0.15) },
  };
}

function hslToHex(h: number, s: number, l: number) {
  h = h % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function genCssCode(hex: string) {
  const c = getBrandColors(hex);
  return `:root {
  --rp-c-brand: ${c.brand.hex}; /* ${c.brand.hsl} */
  --rp-c-brand-dark: ${c.brandDark.hex}; /* ${c.brandDark.hsl} */
  --rp-c-brand-darker: ${c.brandDarker.hex}; /* ${c.brandDarker.hsl} */
  --rp-c-brand-light: ${c.brandLight.hex}; /* ${c.brandLight.hsl} */
  --rp-c-brand-lighter: ${c.brandLighter.hex}; /* ${c.brandLighter.hsl} */
  --rp-c-brand-tint: ${c.brandTint.rgba};
}
`;
}

// Tab indices: 0 = Default/Custom, 1-4 = predefined colors
export function CssPickerEditor() {
  const [value, setValue] = useCssEntry(
    'css-picker-brand-style',
    INITIAL_CONTENT,
  );
  const [pickerColor, setPickerColor] = useState('#0095FF');

  // Determine active tab based on current value
  const getTabIndex = (code: string): number => {
    const idx = PREDEFINED_COLORS.findIndex(
      tab => genCssCode(tab.color) === code,
    );
    return idx !== -1 ? idx + 1 : 0;
  };

  const [activeTab, setActiveTab] = useState(() => getTabIndex(value));

  // Sync activeTab when value changes externally (e.g., reset)
  useEffect(() => {
    const newTab = getTabIndex(value);
    setActiveTab(prev => (prev !== newTab ? newTab : prev));
  }, [value]);

  const isCustomized = activeTab === 0 && value !== INITIAL_CONTENT;
  const firstTabLabel = isCustomized ? 'Custom' : 'Default';

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    if (tabIndex === 0) {
      setValue(INITIAL_CONTENT);
    } else {
      setValue(genCssCode(PREDEFINED_COLORS[tabIndex - 1].color));
    }
  };

  const handleCodeChange = (code: string) => {
    setActiveTab(0);
    setValue(code);
  };

  const debouncedSetValue = useDebounce((color: string) => {
    setActiveTab(0);
    setValue(genCssCode(color));
  }, 50);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPickerColor(color);
    debouncedSetValue(color);
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    backgroundColor: isActive ? 'var(--rp-c-brand)' : 'var(--rp-c-bg)',
    color: isActive ? '#fff' : 'var(--rp-c-text-1)',
    border: '1px solid var(--rp-c-divider-light)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? '500' : '400',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    outline: 'none',
  });

  return (
    <div>
      {/* Tabs and Color Picker */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          marginBottom: 16,
        }}
      >
        {/* Default/Custom tab */}
        <button
          onClick={() => handleTabChange(0)}
          style={tabStyle(activeTab === 0)}
        >
          {firstTabLabel}
        </button>

        {/* Predefined color tabs */}
        {PREDEFINED_COLORS.map((tab, index) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(index + 1)}
            style={tabStyle(activeTab === index + 1)}
          >
            {tab.label}
          </button>
        ))}

        {/* Color picker - standalone, not a tab */}
        <input
          type="color"
          value={pickerColor}
          onChange={handlePickerChange}
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            border: '1px solid var(--rp-c-divider-light)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* CSS Editor */}
      <LiveCodeEditor lang="css" value={value} onChange={handleCodeChange} />
    </div>
  );
}
