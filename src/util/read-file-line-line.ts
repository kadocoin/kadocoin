import fs from 'fs';
import readline from 'readline';
import { blockchainStorageFile } from '../config/constants';

export default async function readFileLineByLine(): Promise<void> {
  const fileStream = fs.createReadStream(blockchainStorageFile);
  const chain = [];

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in the file as a single line break.

  for await (const line of rl) {
    // Each line in the file will be successively available here as `line`.
    chain.push(JSON.parse(line));
  }

  console.log(chain);

  fileStream.close();
}
