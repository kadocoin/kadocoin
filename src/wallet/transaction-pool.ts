import { IChain, TDataChild } from "../types";
import Transaction from "./transaction";

class TransactionPool {
  transactionMap: Record<string, Transaction | TDataChild>;

  constructor() {
    this.transactionMap = {};
  }

  clear(): void {
    this.transactionMap = {};
  }

  setTransaction(transaction: TDataChild | Transaction): void {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: Record<string, TDataChild | Transaction>): void {
    this.transactionMap = transactionMap;
  }

  existingTransactionPool({
    inputAddress,
  }: {
    inputAddress: string;
  }): Transaction | TDataChild {
    const transactions = Object.values(this.transactionMap);

    return transactions.find(
      (transaction) => transaction.input.address === inputAddress
    );
  }

  validTransactions(): Array<Transaction | TDataChild> {
    return Object.values(this.transactionMap).filter((transaction) =>
      Transaction.validTransaction(transaction as TDataChild)
    );
  }

  clearBlockchainTransactions({ chain }: { chain: IChain }): void {
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];

      for (const transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  // END CLASS
}

export default TransactionPool;
