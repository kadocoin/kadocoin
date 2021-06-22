import { IUserModel } from '../types';
import Transaction from './transaction';

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

  clear() {
    this.transactionMap = {};
  }

  setTransaction(transaction: ITransactionParam) {
    this.transactionMap[transaction.id] = transaction;
  }

  setMap(transactionMap: {}) {
    this.transactionMap = transactionMap;
  }

  existingTransactionPool({ inputAddress }: { inputAddress: string }) {
    const transactions = Object.values(this.transactionMap);

    return transactions.find((transaction: any) => transaction.input.address === inputAddress);
  }

  validTransactions(userDoc: IUserModel) {
    return Object.values(this.transactionMap).filter(transaction => Transaction.validTransaction(transaction));
  }

  clearBlockchainTransactions({ chain }: { chain: any[] }) {
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (this.transactionMap[transaction.id]) {
          delete this.transactionMap[transaction.id];
        }
      }
    }
  }

  // END CLASS
}

export default TransactionPool;
