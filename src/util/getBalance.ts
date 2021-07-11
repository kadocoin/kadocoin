/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { TTransactionChild } from '../types';
import Transaction from '../wallet/transaction';

export default function getBalance({
  transactionsPoolMap,
  address,
}: {
  transactionsPoolMap: Record<string, Transaction | TTransactionChild>;
  address: string;
}): string {
  const arr: Array<string> = [];

  Object.values(transactionsPoolMap).map(transaction => {
    for (const addr in transaction['output']) {
      if (addr == address) arr.push(transaction['output'][address] as string);
    }
  });

  return arr.sort()[0];
}
