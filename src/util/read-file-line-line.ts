import fs from 'fs';
import readline from 'readline';
import { blockchainStorageFile } from '../settings';

export default async function readFileLineByLine(): Promise<void> {
  const fileStream = fs.createReadStream(blockchainStorageFile);
  const chain = [];

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    // Each line in the file will be successively available here as `line`.
    chain.push(JSON.parse(line));
  }

  console.log(chain);

  fileStream.close();
}
