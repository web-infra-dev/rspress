#!/usr/bin/env node

import { randomInt } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import sharp from 'sharp';

loadEnv();

const required = [
  'MIDSCENE_MODEL_API_KEY',
  'MIDSCENE_MODEL_NAME',
  'MIDSCENE_MODEL_FAMILY',
  'MIDSCENE_MODEL_BASE_URL',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

// A text-only ping cannot detect a gateway that accepts image_url fields but
// silently routes them to a model without usable vision. Generate a new code
// for every run so a text-only model cannot pass by memorizing the fixture.
const code = String(randomInt(1000, 10_000));
const svg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600">
    <rect width="1000" height="600" fill="white"/>
    <text x="500" y="205" text-anchor="middle" font-family="Arial, sans-serif"
      font-size="92" font-weight="700" fill="black">VISION CODE ${code}</text>
    <polygon points="500,270 345,525 655,525" fill="#e21b3c"/>
  </svg>
`);
const png = await sharp(svg).png().toBuffer();

const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL.replace(/\/+$/, '');
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.MIDSCENE_MODEL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: process.env.MIDSCENE_MODEL_NAME,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Inspect the attached image and report the actual four-digit code, geometric ' +
              'shape, and color that you can see. Do not repeat field names or guess.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${png.toString('base64')}`,
            },
          },
        ],
      },
    ],
    max_tokens: 40,
    temperature: 0,
  }),
  signal: AbortSignal.timeout(90_000),
});

if (!response.ok) {
  throw new Error(`Model vision preflight returned HTTP ${response.status}`);
}

const payload = await response.json();
const answer = payload?.choices?.[0]?.message?.content?.trim() ?? '';
const normalized = answer.toLowerCase().replace(/\s/g, '');
if (
  !normalized.includes(code) ||
  !normalized.includes('triangle') ||
  !normalized.includes('red')
) {
  throw new Error(
    `Model vision preflight could not read the generated image (response: ${JSON.stringify(answer.slice(0, 160))})`,
  );
}

console.log(
  `Model vision preflight passed (${payload.model ?? process.env.MIDSCENE_MODEL_NAME}).`,
);
