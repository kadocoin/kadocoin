import { exec } from 'child_process';
import fs from 'fs';
import logger from './logger';

export default function createFolderOrFile(name_of_file_or_folder: string, type: string): void {
  try {
    if (fs.existsSync(`./${name_of_file_or_folder}`)) {
      logger.info(`${name_of_file_or_folder} ${type} exists.`);
    } else {
      logger.info(`${name_of_file_or_folder} ${type} does not exist.`);
      const command = type == 'file' ? 'touch' : 'mkdir';

      exec(
        `${command} ${name_of_file_or_folder}`,
        error => error && logger.error(`exec error: ${error}`)
      );
    }
  } catch (e) {
    logger.error(`An error occurred creating: ${e}`);
  }
}
