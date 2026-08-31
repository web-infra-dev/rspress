import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

define.lib({
  plugins: [pluginPublint()],
  syntax: 'es2023',
});
