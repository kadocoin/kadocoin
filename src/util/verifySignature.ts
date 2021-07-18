/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { ICOutput_R } from '../types';
import cryptoHash from './crypto-hash';
import newEc from './secp256k1';

export default function verifySignature({
  publicKey,
  transactions,
  signature,
}: {
  publicKey: string;
  transactions: ICOutput_R;
  signature: string;
}): boolean {
  const keyFromPublic = newEc.keyFromPublic(publicKey, 'hex');

  return keyFromPublic.verify(cryptoHash(transactions), signature);
}
