import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function appendToFile(peers: Array<any>, file: string): void {
  const fileStream = fs.createWriteStream(file, { flags: 'a' });

  fileStream.on('error', err => console.log({ type: 'filesystem', err }));

  peers.forEach((peer: any) => fileStream.write(JSON.stringify(peer) + '\n'));

  fileStream.end();
}
