import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as NodePath from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

const appDir = __dirname;

test.describe('plugin og-image test', async () => {
  test.beforeAll(async () => {
    await runBuildCommand(appDir);
  });

  test('should generate og image for home page', async () => {
    const imagePath = NodePath.resolve(appDir, 'doc_build/og/index.png');
    expect(existsSync(imagePath)).toBe(true);

    // Verify it's a valid PNG
    const buffer = await readFile(imagePath);
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
  });

  test('should generate og image for guide page', async () => {
    const imagePath = NodePath.resolve(appDir, 'doc_build/og/guide.png');
    expect(existsSync(imagePath)).toBe(true);

    const buffer = await readFile(imagePath);
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
  });

  test('should generate og image for blog post', async () => {
    const imagePath = NodePath.resolve(
      appDir,
      'doc_build/og/blog/first-post.png',
    );
    expect(existsSync(imagePath)).toBe(true);

    const buffer = await readFile(imagePath);
    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
  });

  test('should have correct image dimensions', async () => {
    const imagePath = NodePath.resolve(appDir, 'doc_build/og/index.png');
    const buffer = await readFile(imagePath);

    // PNG files store width and height at specific byte positions
    // Width is at bytes 16-19, height at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    expect(width).toBe(1200); // Default width
    expect(height).toBe(630); // Default height
  });

  test('should include og:image meta tag in HTML', async () => {
    const htmlPath = NodePath.resolve(appDir, 'doc_build/guide.html');
    const html = await readFile(htmlPath, 'utf-8');

    // Check that og:image meta tag is in the HTML
    expect(html).toContain('og:image');
    expect(html).toContain('og/guide.png');
  });
});
