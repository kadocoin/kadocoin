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
import { totalFeeReward } from '../util/transaction-metrics';
import { cleanUpTransaction } from '../util/clean-up-transaction';

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

  sort({ chain }: { chain: IChain }): IChain {
    return chain.sort((a, b) => {
      if (a.timestamp > b.timestamp) return 1;
      if (a.timestamp < b.timestamp) return -1;
      return 0;
    });
  }

  replaceChain(
    incomingChain: IChain,
    validateTransactions?: boolean,
    localBlockchainLen?: number,
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

    if (!Blockchain.isValidChain(incomingChain, localBlockchainLen)) {
      console.error('The incoming chain must be valid.');
      return;
    }

    if (
      validateTransactions &&
      !this.validTransactionData({ chain: incomingChain, localBlockchainLen })
    ) {
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

  validTransactionData({
    chain,
    localBlockchainLen,
  }: {
    chain: IChain;
    localBlockchainLen: number;
  }): boolean {
    const blocksToValidated = chain.slice(localBlockchainLen - 1);

    for (let i = 1; i < blocksToValidated.length; i++) {
      let rewardTransactionCount = 0;
      const block = blocksToValidated[i];
      const transactionSet = new Set();
      const feeReward = totalFeeReward({ transactions: block.transactions });
      const { MINING_REWARD } = new Mining_Reward().calc({ chainLength: this.chain.length });
      const totalReward = (Number(MINING_REWARD) + Number(feeReward)).toFixed(8);

      for (const transaction of block.transactions) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.output)[0] !== totalReward) {
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

  static isValidChain(chain: IChain, localBlockchainLen?: number): boolean {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    const blocksToValidated = chain.slice(localBlockchainLen - 1);

    for (let i = 1; i < blocksToValidated.length; i++) {
      const { timestamp, lastHash, hash, transactions, nonce, difficulty } = blocksToValidated[i];
      const cleanedTransactions = cleanUpTransaction({ transactions });
      const previousHash = blocksToValidated[i - 1].hash;
      const validatedHash = cryptoHash(timestamp, lastHash, cleanedTransactions, nonce, difficulty);
      const lastDifficulty = blocksToValidated[i - 1].difficulty;

      if (previousHash !== lastHash) return false;

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW
    }

    return true;
  }
}

export default Blockchain;
