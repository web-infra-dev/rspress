import chalk from 'chalk';
import type { Logger } from '@rspress/core';

export const rspressMark = chalk.magenta.bold('[Rspress]');

export const logger: Logger = {
  info(msg: string) {
    console.log(`${rspressMark} ${msg}`);
  },
  error(msg: string) {
    console.log(`${rspressMark} ${chalk.red(msg)}`);
  },
  warn(msg: string) {
    console.log(`${rspressMark} ${chalk.yellow(msg)}`);
  },
  success(msg: string) {
    console.log(`${rspressMark} ${chalk.green(msg)}`);
  },
  debug(msg: string) {
    if (process.env.DEBUG) {
      console.log(`${rspressMark} ${chalk.grey(msg)}`);
    }
  },
  log(msg: string) {
    console.log(`${rspressMark} ${msg}`);
  },
};
