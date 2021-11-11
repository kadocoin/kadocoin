import fs from 'fs';
import readline from 'readline';

export default function getPeersFromFile(peersStorageFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const inStream = fs.createReadStream(peersStorageFile);
    const rl = readline.createInterface(inStream);
    const peers: string[] = [];

    rl.on('line', function (line) {
      if (line.length >= 1) {
        peers.push(JSON.parse(line));
      }
    });

    rl.on('error', reject);

    rl.on('close', function () {
      resolve(JSON.stringify(peers));
    });
  });
}
