import Block from "./block";
import cryptoHash from "../util/crypto-hash";
import { REWARD_INPUT, MINING_REWARD } from "../config/constants";
import Transaction from "../wallet/transaction";

class Blockchain {
  chain: any[];

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }: { data: any }): void {
    const newBlock = Block.minedBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(
    incomingChain: any[],
    validateTransactions?: boolean,
    onSuccess?: () => void
  ): void {
    if (
      incomingChain.length > 1 &&
      this.chain.length > 1 &&
      incomingChain.length <= this.chain.length
    ) {
      console.error("The incoming chain must be longer.");
      return;
    }

    if (!Blockchain.isValidChain(incomingChain)) {
      console.error("The incoming chain must be valid.");
      return;
    }

    if (
      validateTransactions &&
      !this.validTransactionData({ chain: incomingChain })
    ) {
      console.error("The incoming chain has an invalid data");
      return;
    }

    if (onSuccess) onSuccess();

    this.chain = incomingChain;
    console.log(
      "replaced the existing blockchain with the incoming consensus blockchain:",
      incomingChain
    );
  }

  validTransactionData({ chain }: { chain: any }): boolean {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (const transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error("Miner rewards exceed limit");
            return false;
          }

          if (Object.values(transaction.output)[0] !== MINING_REWARD) {
            console.error("Miner reward amount is invalid");
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error("Invalid transaction");
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error(
              "An identical transaction appears more than once in the block"
            );
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }

      // END FOR LOOP
    }

    return true;
  }

  static isValidChain(chain: any[]): boolean {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))
      return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i];
      const previousHash = chain[i - 1].hash;
      const validatedHash = cryptoHash(
        timestamp,
        lastHash,
        data,
        nonce,
        difficulty
      );
      const lastDifficulty = chain[i - 1].difficulty;

      if (previousHash !== lastHash) return false;

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW
    }

    return true;
  }
}

export default Blockchain;
