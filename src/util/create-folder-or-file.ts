import { exec } from 'child_process';
import fs from 'fs';

export default function createFolderOrFile(name_of_file_or_folder: string, type: string): void {
  try {
    if (fs.existsSync(`./${name_of_file_or_folder}`)) {
      console.log(`${name_of_file_or_folder} ${type} exists.`);
    } else {
      console.log(`${name_of_file_or_folder} ${type} does not exist.`);
      const command = type == 'file' ? 'touch' : 'mkdir';

      exec(`${command} ${name_of_file_or_folder}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    }
  } catch (e) {
    console.log('An error occurred creating .');
  }
}
