import Transaction from "../wallet/transaction";

class TransactionMiner {
  [x: string]: any;
  constructor({
    blockchain,
    transactionPool,
    address,
    pubSub,
  }: {
    blockchain: any;
    transactionPool: any;
    pubSub: any;
    address: string;
  }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.pubSub = pubSub;
    this.address = address;
  }

  mineTransactions() {
    // GET THE TRANSACTION POOL VALID TRANSACTIONS
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
