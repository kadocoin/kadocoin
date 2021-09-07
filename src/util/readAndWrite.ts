import fs from 'fs';
const path = 'src/array.txt';

export default async function readWrite(): Promise<void> {
  try {
    if (fs.existsSync(path)) {
      // EXISTS
      console.log('file exists');
    } else {
      // file does not exists
      console.log('file does NOT exists');
    }
  } catch (err) {
    console.error(err);
  }
}
