import * as path from 'node:path';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
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

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  tools: {
    rspack: config => {
      if (process.env.RSDOCTOR) {
        config.plugins?.push(
          new RsdoctorRspackPlugin({
            ...commonRsdoctorConfig,
            output: {
              ...commonRsdoctorConfig.output,
              reportDir: `./doc_build/diff-rsdoctor/${config.name}`,
            },
          }),
        );
      }
      return config;
    },
  },
});
