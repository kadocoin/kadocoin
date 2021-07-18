import { TTransactions } from '../types';

export function cleanUpTransaction({
  transactions,
}: {
  transactions: TTransactions;
}): Array<number | string> {
  const items = [];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    // ADD ID
    items.push(transaction.id);

    // ADD AMOUNT
    Object.values(transaction['output']).map(o => items.push(o));

    // ADD INPUT VALUES
    for (const key in transaction['input']) {
      if (Object.prototype.hasOwnProperty.call(transaction['input'], key)) {
        if (key == 'timestamp') items.push(transaction['input'][key]);
        if (key == 'amount') items.push(transaction['input'][key]);
        if (key == 'address') items.push(transaction['input'][key]);
        if (key == 'publicKey') items.push(transaction['input'][key]);
        if (key == 'localPublicKey') items.push(transaction['input'][key]);
      }
    }
  }

  return items;
}
