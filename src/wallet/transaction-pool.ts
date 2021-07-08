/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { IChain, TTransactionChild } from '../types';
import { totalFeeReward, totalMsgReward } from '../util/transaction-metrics';
import Transaction from './transaction';

class TransactionPool {
  transactionMap: Record<string, Transaction | TTransactionChild>;

  constructor() {
    this.transactionMap = {};
  }

  clear(): void {
    this.transactionMap = {};
  }

  /**
   * Sort in descending order - transactions with fatter reward first
   * @method Sort()
   * @param Array of transactions
   */
  sort({ transactions }: { transactions: Array<TTransactionChild> }): Array<TTransactionChild> {
    return transactions.sort((a, b) => {
      const msg_fee_A = totalMsgReward({ transactions: [a] });
      const send_fee_A = totalFeeReward({ transactions: [a] });

      const msg_fee_B = totalMsgReward({ transactions: [b] });
      const send_fee_B = totalFeeReward({ transactions: [b] });

      const total_reward_A = Number(msg_fee_A) + Number(send_fee_A);
      const total_reward_B = Number(msg_fee_B) + Number(send_fee_B);

      if (total_reward_A < total_reward_B) return 1;
      if (total_reward_A > total_reward_B) return -1;
      return 0;
    });
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
    return this.sort({ transactions: Object.values(this.transactionMap) }).filter(transaction =>
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
