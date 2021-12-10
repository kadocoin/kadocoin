import { exec } from 'child_process';
import fs from 'fs';

export default function createFolder(folder_name: string): void {
  try {
    if (fs.existsSync(`./${folder_name}`)) {
      console.log(`${folder_name} directory exists.`);
    } else {
      console.log(`${folder_name} directory does not exist.`);
      exec(`mkdir ${folder_name}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    }
  } catch (e) {
    console.log('An error occurred.');
  }
}
