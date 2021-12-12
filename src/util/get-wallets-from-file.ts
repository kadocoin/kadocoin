import fs from 'fs';

export default function getWalletsFromFile(): void {
  fs.readFile('wallets/wallets.txt', { encoding: 'utf-8' }, function (err, data) {
    if (!err) {
      console.log(JSON.parse(data));
    } else {
      console.log(err);
    }
  });
}
