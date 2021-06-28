import Blockchain from "../blockchain";
import PubSub from "../pubSub";
import Transaction from "../wallet/transaction";
import TransactionPool from "../wallet/transaction-pool";

class TransactionMiner {
  public blockchain: Blockchain;
  public transactionPool: TransactionPool;
  public pubSub: PubSub;
  public address: string;

  constructor({
    blockchain,
    transactionPool,
    address,
    pubSub,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    pubSub: PubSub;
    address: string;
  }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.pubSub = pubSub;
    this.address = address;
  }

  mineTransactions(): string {
    // GET THE TRANSACTION POOL'S VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();

    if (validTransactions.length) {
      // GENERATE MINER'S REWARD
      validTransactions.push(
        Transaction.rewardTransaction({ minerPublicKey: this.address })
      );

      // ADD A BLOCK CONSISTING OF THESE TRANSACTION TO THE BLOCK
      this.blockchain.addBlock({ data: validTransactions });

      // BROADCAST THE UPDATED BLOCKCHAIN
      this.pubSub.broadcastChain();

      // CLEAR THE POOL
      this.transactionPool.clear();

      return "success";
    }
    return "error";
  }
}

export default TransactionMiner;
