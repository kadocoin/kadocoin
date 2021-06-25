/* eslint-disable @typescript-eslint/no-explicit-any */
import Transaction from "./transaction";

interface ITransactionParam {
  id: string;
  input: any;
  outputMap: any;
}

class TransactionPool {
  transactionMap: {
    [x: string]: any;
  };

  constructor() {
    this.transactionMap = {};
  }

  clear(): void {
    this.transactionMap = {};
  }

  setTransaction(transaction: ITransactionParam): void {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: Record<any, never>): void {
    this.transactionMap = transactionMap;
  }

  existingTransactionPool({
    inputAddress,
  }: {
    inputAddress: string;
  }): Transaction {
    const transactions = Object.values(this.transactionMap);

    return transactions.find(
      (transaction: any) => transaction.input.address === inputAddress
    );
  }

  validTransactions(): any[] {
    return Object.values(this.transactionMap).filter((transaction) =>
      Transaction.validTransaction(transaction)
    );
  }

  clearBlockchainTransactions({ chain }: { chain: any[] }): void {
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
