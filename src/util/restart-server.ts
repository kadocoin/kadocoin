import { logFile } from '../config/constants';
import appendToFile from './appendToFile';
import logger from './logger';

export default function restartServer(): void {
  setInterval(
    () => appendToFile([`Kadocoin restarted - ${new Date().toLocaleString()}`], logFile),
    60 * 1000 /** 60 SEC */
  );
  logger.warn('Restarting Kadocoin...');
}
