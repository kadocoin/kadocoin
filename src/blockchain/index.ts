import Block from './block';
import { cryptoHash } from '../util/index';
import { REWARD_INPUT, MINING_REWARD } from '../config/constants';
import Transaction from '../wallet/transaction';

class Blockchain {
  chain: any[];

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }: { data: any }) {
    const newBlock = Block.minedBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });

    this.chain.push(newBlock);
  }

  replaceChain(incomingChain: any, validateTransactions?: any, onSuccess?: any) {
    if (incomingChain.length <= this.chain.length) {
      console.error('The incoming chain must be longer.');
      return;
    }

    if (!Blockchain.isValidChain(incomingChain)) {
      console.error('The incoming chain must be valid.');
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain: incomingChain })) {
      console.error('The incoming chain has an invalid data');
      return;
    }

    if (onSuccess) onSuccess();

    console.log('replacing the existing chain with the incoming chain:', incomingChain);
    this.chain = incomingChain;
  }

  validTransactionData({ chain }: { chain: any }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the block');
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

  static isValidChain(chain: any) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i];
      const previousHash = chain[i - 1].hash;
      const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
      const lastDifficulty = chain[i - 1].difficulty;

      if (previousHash !== lastHash) return false;

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW
    }

    return true;
  }
}

export default Blockchain;
