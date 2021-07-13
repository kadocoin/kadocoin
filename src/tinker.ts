import Wallet from './wallet';

const wallet = new Wallet();
console.log({ address: wallet.address, publicKey: wallet.publicKey });
