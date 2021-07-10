import { TTransactionChild } from '../types';
import Transaction from '../wallet/transaction';
import TransactionPool from '../wallet/transaction-pool';

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
