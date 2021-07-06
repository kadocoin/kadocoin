import Blockchain from '../blockchain';
import PubSub from '../pubSub';
import { ITMinerConstructorParams } from '../types';
import Transaction from '../wallet/transaction';
import TransactionPool from '../wallet/transaction-pool';

class TransactionMiner {
  public blockchain: Blockchain;
  public transactionPool: TransactionPool;
  public pubSub: PubSub;
  public address: string;
  public message: string;

  constructor({ blockchain, transactionPool, address, pubSub, message }: ITMinerConstructorParams) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.pubSub = pubSub;
    this.address = address;
    this.message = message;
  }

  mineTransactions(): string {
    // GET THE TRANSACTION POOL'S VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();

    if (validTransactions.length) {
      // ITERATE OVER VALID TRANSACTIONS AND RETRIEVE TOTAL MESSAGE MONEY
      // GENERATE MINER'S REWARD
      validTransactions.push(
        Transaction.rewardTransaction({
          minerPublicKey: this.address,
          message: this.message,
          chainLength: this.blockchain.chain.length,
        })
      );

      // ADD A BLOCK CONSISTING OF THESE TRANSACTION TO THE BLOCK
      this.blockchain.addBlock({ transactions: validTransactions });

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
