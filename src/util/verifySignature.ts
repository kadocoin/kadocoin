import { ICOutput_R, TDataChild } from '../types';
import cryptoHash from './crypto-hash';
import newEc from './secp256k1';

export default function verifySignature({
  publicKey,
  data,
  signature,
}: {
  publicKey: string;
  data: ICOutput_R | TDataChild[];
  signature: string;
}): boolean {
  const keyFromPublic = newEc.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(data), signature);
}
