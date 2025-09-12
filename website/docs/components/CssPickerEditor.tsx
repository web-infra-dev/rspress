import { useMemo, useState } from 'react';
import { CssLiveCodeEditor } from './CssLiveCodeEditor';

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
  // hex to rgb
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
    brandDark: adjustLightness(hex, 0),
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

export function CssPickerEditor() {
  const [color, setColor] = useState('#0095ff');
  const cssCode = useMemo(() => genCssCode(color), [color]);

  return (
    <div>
      <label>
        Theme Color:{' '}
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{
            verticalAlign: 'middle',
            width: 32,
            height: 32,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        />
        <span style={{ marginLeft: 8 }}>{color}</span>
      </label>
      <div style={{ marginTop: 16 }}>
        <CssLiveCodeEditor value={cssCode} initialCode={cssCode} />
      </div>
    </div>
  );
}
