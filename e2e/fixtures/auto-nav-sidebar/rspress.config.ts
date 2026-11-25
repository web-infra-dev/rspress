import * as path from 'node:path';
import { RsdoctorRspackPlugin } from '@rsdoctor/core';
import { defineConfig } from '@rspress/core';

const commonRsdoctorConfig = {
  disableClientServer: true,
  output: {
    mode: 'brief' as const,
    options: {
      type: ['json'] as ('json' | 'html')[],
    },
  },
};

const getRsdoctorReportType = (environmentName?: string) => {
  switch (environmentName) {
    case 'node':
      return 'html';
    case 'node_md':
      return 'md';
    case 'web':
      return 'js';
    default:
      return environmentName ?? 'unknown';
  }
};

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  builderConfig: {
    tools: {
      rspack: config => {
        if (process.env.RSDOCTOR) {
          config.plugins ??= [];
          config.plugins.push(
            new RsdoctorRspackPlugin({
              ...commonRsdoctorConfig,
              output: {
                ...commonRsdoctorConfig.output,
                // The diff workflow uses this fixture to track new-project bundle size.
                reportDir: `./doc_build/diff-rsdoctor/new_project_${getRsdoctorReportType(config.name)}`,
              },
            }),
          );
        }
        return config;
      },
    },
  },
});
