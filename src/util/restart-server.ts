import { logFile } from '../config/constants';
import appendToFile from './appendToFile';

export default function restartServer(): void {
  setInterval(
    () => appendToFile([`Kadocoin restarted - ${new Date().toLocaleString()}`], logFile),
    60 * 1000 /** 60 SEC */
  );
  console.log("Kadocoin didn't connected with other peers. Restarting...");
}
