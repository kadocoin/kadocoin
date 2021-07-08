/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Block from './block';
import cryptoHash from '../util/crypto-hash';
import { REWARD_INPUT } from '../config/constants';
import Transaction from '../wallet/transaction';
import { IChain, TTransactions } from '../types';
import size from '../util/size';
import Mining_Reward from '../util/supply_reward';
import { totalFeeReward, totalMsgReward } from '../util/transaction-metrics';

class Blockchain {
  public chain: IChain;

  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ transactions }: { transactions: TTransactions }): void {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      transactions,
      chain: this.chain,
    });

    this.chain.push(newBlock);
  }

  replaceChain(
    incomingChain: IChain,
    validateTransactions?: boolean,
    onSuccess?: () => void
  ): void {
    if (
      incomingChain.length > 1 &&
      this.chain.length > 1 &&
      incomingChain.length <= this.chain.length
    ) {
      console.error('The incoming chain must be longer.');
      return;
    }

    if (!Blockchain.isValidChain(incomingChain)) {
      console.error('The incoming chain must be valid.');
      return;
    }

    if (validateTransactions && !this.validTransactionData({ chain: incomingChain })) {
      console.error('The incoming chain has an invalid transaction');
      return;
    }

    if (onSuccess) onSuccess();

    this.chain = incomingChain;
    console.log(
      `Replaced your LOCAL blockchain with the incoming consensus blockchain: ${size(
        this.chain
      )} bytes`
    );
  }

  validTransactionData({ chain }: { chain: IChain }): boolean {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;
      const totalMiningReward = (
        Number(new Mining_Reward().calc({ chainLength: this.chain.length }).MINING_REWARD) +
        Number(totalMsgReward({ transactions: block.transactions })) +
        Number(totalFeeReward({ transactions: block.transactions }))
      ).toFixed(8);

      for (const transaction of block.transactions) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          console.log(Object.values(transaction.output)[0], totalMiningReward);

          if (Object.values(transaction.output)[0] !== totalMiningReward) {
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

  static isValidChain(chain: IChain): boolean {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, transactions, nonce, difficulty } = chain[i];
      const previousHash = chain[i - 1].hash;
      const validatedHash = cryptoHash(timestamp, lastHash, transactions, nonce, difficulty);
      const lastDifficulty = chain[i - 1].difficulty;
      console.log({ previousHash, lastHash, validatedHash, lastDifficulty, hash });
      if (previousHash !== lastHash) return false;

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW
    }

    return true;
  }
}

export default Blockchain;
