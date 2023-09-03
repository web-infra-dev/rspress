import chalk from 'chalk';

export const rspressMark = chalk.cyan('[Rspress]');

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
  success: (msg: string) => void;
  debug: (msg: string) => void;
  log: (msg: string) => void;
}

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
