import { IUserModel } from '../types';
import Transaction from '../wallet/transaction';

class TransactionMiner {
  [x: string]: any;
  constructor({ blockchain, transactionPool, publicKey, pubSub }: { blockchain: any; transactionPool: any; publicKey: any; pubSub: any }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.publicKey = publicKey;
    this.pubSub = pubSub;
  }

  mineTransactions() {
    // GET THE TRANSACTION POOL VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();

    if (validTransactions.length) {
      // GENERATE MINER'S REWARD
      validTransactions.push(Transaction.rewardTransaction({ minerPublicKey: this.publicKey }));
      // ADD A BLOCK CONSISTING OF THESE TRANSACTION TO THE BLOCK
      this.blockchain.addBlock({ data: validTransactions });
      // BROADCAST THE UPDATED BLOCKCHAIN
      this.pubSub.broadcastChain();
      // CLEAR THE POOL
      this.transactionPool.clear();

      return 'success';
    }
    return 'error';
  }
}

export default TransactionMiner;
