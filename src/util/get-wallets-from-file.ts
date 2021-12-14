import fs from 'fs';

export default function getWalletsFromFile(): string[] {
  return fs.readFileSync('wallets/wallets.txt', 'utf-8').split('\n').filter(Boolean);
}
