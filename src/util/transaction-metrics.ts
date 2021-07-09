import { TTransactions } from '../types';

export function transactionVolume({ transactions }: { transactions: TTransactions }): string {
  let totalTransactionsAmount = 0;

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];

    for (const prop in transaction['output']) {
      if (prop !== transaction['input'].address /** sender address*/)
        totalTransactionsAmount += Number(transaction['output'][prop]);
    }
  }

  return totalTransactionsAmount.toFixed(8);
}
