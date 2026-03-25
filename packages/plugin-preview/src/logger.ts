import { createLogger } from '@rsbuild/core';
import picocolors from 'picocolors';

const prefix = picocolors.dim('[@rspress/plugin-preview]');

export const previewLogger = createLogger({ level: 'info', prefix });

export const pluginLogger = createLogger({ level: 'error', prefix });
