import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function appendToFile(blockchain: any): void {
  const fileStream = fs.createWriteStream('src/array.txt', { flags: 'a' });

  fileStream.on('error', function (err) {
    /* error handling */
    console.log({ err });
  });

  blockchain.forEach((blk: any) => fileStream.write(JSON.stringify(blk) + '\n'));

  fileStream.end();
}
