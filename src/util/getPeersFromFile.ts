import fs from 'fs';
import readline from 'readline';
import { IHost } from '../types';
import ConsoleLog from './console-log';

export default function getPeersFromFile(peersStorageFile: string): Promise<Array<IHost>> {
  return new Promise(resolve => {
    const inStream = fs.createReadStream(peersStorageFile);
    const rl = readline.createInterface(inStream);
    const peers: Array<IHost> = [];

    rl.on('line', function (line) {
      if (line.length >= 1) {
        peers.push(JSON.parse(line));
      }
    });

    rl.on('error', err => ConsoleLog(`Error reading file: ${err}`));

    rl.on('close', function () {
      if (peers.length) {
        resolve(peers);
      }

      resolve([]);
    });
  });
}
