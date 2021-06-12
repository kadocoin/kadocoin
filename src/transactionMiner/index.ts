import Transaction from "../wallet/transaction";

class TransactionMiner {
  [x: string]: any;
  constructor({ blockchain, transactionPool, wallet, pubsub }: { blockchain: any, transactionPool: any; wallet: any; pubsub: any }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransactions() {
    // GET THE TRANSACTION POOL VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();
    // GENERATE MINER'S REWARD
    validTransactions.push(Transaction.rewardTransaction({ minerWallet: this.wallet }));
    // ADD A BLOCK CONSISTING OF THESE TRANSACTION TO THE BLOCK
    this.blockchain.addBlock({ data: validTransactions });
    // BROADCAST THE UPDATED BLOCKCHAIN
    this.pubsub.broadcastChain();
    // CLEAR THE POOL
    this.transactionPool.clear();
  }
}

export default TransactionMiner;
