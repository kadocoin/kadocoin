import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function appendWalletToFile(wallets: Array<string>, file: string): void {
  const fileStream = fs.createWriteStream(file, { flags: 'a' });

  fileStream.on('error', err => console.log({ type: 'filesystem', err }));

  wallets.map(wallet => {
    console.log('');
    console.log(`======== Adding Wallet ========`);
    fileStream.write(wallet + '\n');
    console.log('');
  });

  fileStream.end();
}
