import { logFile } from '../config/constants';
import appendToFile from './appendToFile';

export default function restartServer(): void {
  setInterval(
    () => appendToFile([`Kadocoin restarted - ${new Date().toLocaleString()}`], logFile),
    15 * 1000 /** 10 SEC */
  );
  console.log("Kadocoin didn't connected with other peers. Restarting...");
}
