/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { IChain } from '../types';
import Transaction from './transaction';

class TransactionPool {
  transactionMap: Record<string, Transaction>;

  constructor() {
    this.transactionMap = {};
  }

  clear(): void {
    this.transactionMap = {};
  }

  setTransaction(transaction: Transaction): void {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: Record<string, Transaction>): void {
    const transactions = Object.values(transactionMap);

    transactions.forEach(transaction => {
      transaction = new Transaction({
        id: transaction.id,
        output: transaction.output,
        input: transaction.input,
      });

      this.setTransaction(transaction);
    });
  }

  existingTransactionPool({ inputAddress }: { inputAddress: string }): Transaction {
    const transactions = Object.values(this.transactionMap);

    let transaction = transactions.find(transaction => transaction.input.address === inputAddress);

    if (transaction) {
      return (transaction = new Transaction({
        id: transaction.id,
        output: transaction.output,
        input: transaction.input,
      }));
    } else {
      return null;
    }
  }

  validTransactions(): Array<Transaction> {
    return Object.values(this.transactionMap).filter(transaction => {
      const isValid = Transaction.validTransaction(transaction);

      if (isValid) {
        transaction = new Transaction({
          id: transaction.id,
          output: transaction.output,
          input: transaction.input,
        });

        return transaction;
      }
    });
  }

  clearBlockchainTransactions({ chain }: { chain: IChain }): void {
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];

      for (const transaction of block.transactions) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  // END CLASS
}

export default TransactionPool;
