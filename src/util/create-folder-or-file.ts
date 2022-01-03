import { exec } from 'child_process';
import fs from 'fs';
import logger from './logger';

export default function createFolderOrFile(name_of_file_or_folder: string, type: string): void {
  try {
    if (!fs.existsSync(`./${name_of_file_or_folder}`)) {
      const command = type == 'file' ? 'touch' : 'mkdir';

      exec(`${command} ${name_of_file_or_folder}`, err => {
        if (err) return logger.error(`exec error: ${err}`);
        logger.info(`Created ${name_of_file_or_folder} ${type}.`);
      });
    }
  } catch (e) {
    logger.error(`An error occurred creating: ${e}`);
  }
}
