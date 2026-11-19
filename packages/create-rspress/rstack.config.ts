import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

define.lib({
  exports: true,
  plugins: [pluginPublint()],
  syntax: 'es2023',
});
