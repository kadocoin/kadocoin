/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { IChain, TTransactionChild } from '../types';
import Transaction from './transaction';

class TransactionPool {
  transactionMap: Record<string, Transaction | TTransactionChild>;

  constructor() {
    this.transactionMap = {};
  }

  clear(): void {
    this.transactionMap = {};
  }

  setTransaction(transaction: TTransactionChild | Transaction): void {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: Record<string, TTransactionChild | Transaction>): void {
    this.transactionMap = transactionMap;
  }

  existingTransactionPool({
    inputAddress,
  }: {
    inputAddress: string;
  }): Transaction | TTransactionChild {
    const transactions = Object.values(this.transactionMap);

    return transactions.find(transaction => transaction.input.address === inputAddress);
  }

  validTransactions(): Array<Transaction | TTransactionChild> {
    return Object.values(this.transactionMap).filter(transaction =>
      Transaction.validTransaction(transaction as TTransactionChild)
    );
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
