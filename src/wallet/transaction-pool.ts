/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { IChain } from '../types';
import logger from '../util/logger';
import size from '../util/size';
import Transaction from './transaction';

class TransactionPool {
  public transactionMap: Record<string, Transaction>;

  constructor() {
    this.transactionMap = {};
  }

  orderTransactionsAccordingToSendFee(): Map<string, Transaction[]> {
    const fee_bucket = new Map();
    const unit = 1024 * 1024;

    for (const txn in this.transactionMap) {
      const sendFee = this.transactionMap[txn]['input']['sendFee'] || 0;

      const size_of_txn_in_bytes = size(this.transactionMap[txn]);
      const weight_per_fee = Math.ceil((Number(sendFee) * unit) / Number(size_of_txn_in_bytes));

      if (fee_bucket.has(weight_per_fee)) {
        fee_bucket.get(weight_per_fee).push(this.transactionMap[txn]);
      } else {
        fee_bucket.set(weight_per_fee, [this.transactionMap[txn]]);
      }
    }

    return fee_bucket;
  }

  sortTransactionsWithHigherFeesFirst(
    orderTransactions: Map<string, Transaction[]>
  ): Map<string, Transaction[]> {
    const keys_reversed = Array.from(orderTransactions.keys()).sort().reverse();
    const sorted = new Map();

    for (let i = 0; i < keys_reversed.length; i++) {
      const key = keys_reversed[i];
      sorted.set(key, orderTransactions.get(key));
    }

    return sorted;
  }

  // FILTER TRANSACTIONS WITH HIGHER SEND FEES TO MINE
  filterTransactionsAccordingToSendFee(
    bucket: Map<string, Transaction[]>
  ): Record<string, Transaction> {
    let weight = 0;
    const max_weight = 1024 * 1024;
    const txn_to_mine: Record<string, Transaction> = {};

    bucket.forEach(transactions => {
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const weight_of_txn = size(transaction);

        // EXIT ADDING MORE TRANSACTIONS IF LIMIT IS REACHED
        if (weight > max_weight) return console.log('I now have enough to mine');

        // ADD THIS TRANSACTION TO BUCKET
        txn_to_mine[transaction['id']] = transaction;

        // ADD THE WEIGHT OF THIS TRANSACTION TO THE COUNTER
        weight += Number(weight_of_txn);
      }
    });

    return txn_to_mine;
  }

  clear(): void {
    this.transactionMap = {};
  }

  setTransaction(transaction: Transaction): void {
    this.transactionMap[transaction.id] = transaction;
  }

  onSyncAddTransactions(transactionMap: Record<string, Transaction>): void {
    const transactions = Object.values(transactionMap);

    transactions.forEach(transaction => {
      transaction = new Transaction({
        id: transaction.id,
        output: transaction.output,
        input: transaction.input,
      });

      this.setTransaction(transaction);
    });

    logger.info('Added latest unconfirmed transactions.');
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
    const ordered_txn = this.orderTransactionsAccordingToSendFee();
    const sorted_txn = this.sortTransactionsWithHigherFeesFirst(ordered_txn);
    const filtered_txn = this.filterTransactionsAccordingToSendFee(sorted_txn);

    return Object.values(filtered_txn).filter(transaction => {
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
