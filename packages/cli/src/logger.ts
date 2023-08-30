import chalk from 'chalk';
import type { Logger } from '@rspress/core';

export const rspressMark = chalk.cyan('[Rspress]');

export const logger: Logger = {
  info(msg: string) {
    console.log(`${chalk.cyan.bold('[info]')} ${msg}`);
  },
  error(msg: string) {
    console.log(`${chalk.red('[error]')} ${msg}`);
  },
  warn(msg: string) {
    console.log(`${chalk.yellow('[warn]')} ${msg}`);
  },
  success(msg: string) {
    console.log(`${chalk.green('[success]')} ${msg}`);
  },
  debug(msg: string) {
    if (process.env.DEBUG) {
      console.log(`${chalk.gray('[rspress:debug]')} ${msg}`);
    }
  },
  log(msg: string) {
    console.log(`${chalk.cyan('[rspress]')} ${msg}`);
  },
};
