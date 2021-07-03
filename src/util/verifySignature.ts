import { ICOutput_R, TTransactionChild } from '../types';
import cryptoHash from './crypto-hash';
import newEc from './secp256k1';

export default function verifySignature({
  publicKey,
  transactions,
  signature,
}: {
  publicKey: string;
  transactions: ICOutput_R | TTransactionChild[];
  signature: string;
}): boolean {
  const keyFromPublic = newEc.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(transactions), signature);
}
