import { createRequire } from 'module';
import { cac } from 'cac';

const require = createRequire(import.meta.url);

// eslint-disable-next-line import/no-commonjs
const packageJson = require('../../package.json');

const cli = cac('rspress').version(packageJson.version).help();

cli.option('--config [config]', 'Specify the path to the config file');

cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .action((root, options) => {
    console.log('root', root);
    console.log('options', options);
  });

cli.parse();
