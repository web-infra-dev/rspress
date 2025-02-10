import path from 'node:path';

export default {
  plugins: {
    tailwindcss: {
      config: path.join(__dirname, './tailwind.config.ts'),
    },
  },
};
