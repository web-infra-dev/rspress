import { readFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';
import { defaultTemplate } from './template';
import type { OgImageOptions, OgImageTemplateData } from './types';

let cachedFont: Buffer | null = null;

/**
 * Get font data for Satori
 */
async function getFontData(): Promise<Buffer> {
  if (cachedFont) {
    return cachedFont;
  }

  try {
    // Try to use a system font or bundled font
    // For now, we'll use a simple approach - in production this might need bundled fonts
    const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
    const fontData = await readFile(fontPath);
    cachedFont = Buffer.from(fontData);
    return cachedFont;
  } catch (error) {
    // Fallback: return empty buffer and Satori will use default
    console.warn('Could not load font, using Satori defaults');
    return Buffer.from([]);
  }
}

/**
 * Generate OG image PNG from template data
 */
export async function generateOgImage(
  data: OgImageTemplateData,
  options: OgImageOptions = {},
): Promise<Buffer> {
  const { width = 1200, height = 630, template = defaultTemplate } = options;

  // Get the template (either custom or default)
  const templateResult =
    typeof template === 'function' ? await template(data) : template;

  // Convert template to SVG using Satori
  const svg = await satori(templateResult, {
    width,
    height,
    fonts: [
      {
        name: 'sans-serif',
        data: await getFontData(),
        weight: 400,
        style: 'normal',
      },
    ],
  });

  // Convert SVG to PNG using Sharp
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return png;
}
