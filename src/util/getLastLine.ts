import fs from 'fs';
import readline from 'readline';

export default function getLastLine(): Promise<number> {
  const inStream = fs.createReadStream('src/array.txt');

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface(inStream);

    let lastLine = '';
    rl.on('line', function (line) {
      if (line.length >= 1) {
        lastLine = line;
      }
    });

    rl.on('error', reject);

    rl.on('close', function () {
      if (lastLine) {
        resolve(JSON.parse(lastLine).blockchainHeight);
      }
      resolve(1);
    });
  });
}
