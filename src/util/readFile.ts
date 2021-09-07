import fs from 'fs';
import readline from 'readline';

export default async function processLineByLine(): Promise<void> {
  const fileStream = fs.createReadStream('src/array.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in src/array2.txt as a single line break.

  for await (const line of rl) {
    // Each line in src/array2.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }

  fileStream.close();
}
