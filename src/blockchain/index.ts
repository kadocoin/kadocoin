/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Block from './block';
import cryptoHash from '../util/crypto-hash';
import { blockchainStorageFile, REWARD_INPUT } from '../config/constants';
import Transaction from '../wallet/transaction';
import { IChain, incomingObj, TTransactions } from '../types';
import size from '../util/size';
import Mining_Reward from '../util/supply_reward';
import { totalFeeReward } from '../util/transaction-metrics';
import { cleanUpTransaction } from '../util/clean-up-transaction';
import { KADOCOIN_VERSION } from '../config/constants';
import appendToFile from '../util/appendToFile';
import fs from 'fs';
import getFileContentLineByLine from '../util/get-file-content-line-by-line';
import logger from '../util/logger';

class Blockchain {
  public chain: IChain;

  constructor({ chain }: { chain?: IChain } = {}) {
    this.chain = chain && chain.length ? chain : [Block.genesis()];
  }

  async loadBlocksFromFileOrCreateNew(): Promise<Blockchain> {
    if (fs.existsSync(blockchainStorageFile)) {
      const chain = await getFileContentLineByLine(blockchainStorageFile);
      return new Blockchain({ chain });
    }

    return new Blockchain();
  }

  addBlock({ transactions }: { transactions: TTransactions }): Block {
    const newlyMinedBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      transactions,
      chain: this.chain,
    });

    this.chain.push(newlyMinedBlock);
    return newlyMinedBlock;
  }

  private sort({ chain }: { chain: IChain }): IChain {
    return chain.sort((a, b) => {
      if (a.timestamp > b.timestamp) return 1;
      if (a.timestamp < b.timestamp) return -1;
      return 0;
    });
  }

  addBlockFromPeerToLocal(
    incomingObj: incomingObj,
    validateTransactions?: boolean,
    localBlockchain?: IChain,
    onSuccess?: () => void
  ): void {
    if (incomingObj.info.height < localBlockchain.length) {
      console.error('The incoming chain must be longer.');
      return;
    }

    if (!Blockchain.isValidBlock(incomingObj, localBlockchain)) {
      console.error('The incoming block is not valid.');
      return;
    }

    if (validateTransactions && !this.isValidTransactionData({ block: incomingObj.block })) {
      console.error('The incoming block has an invalid transaction');
      return;
    }
    // CHECK VERSION COMPATIBILITY
    if (incomingObj.info.KADOCOIN_VERSION != KADOCOIN_VERSION) {
      console.error('The incoming block has an invalid VERSION');
      return;
    }

    if (onSuccess) onSuccess();

    this.chain.push(incomingObj.block);

    appendToFile([incomingObj.block], blockchainStorageFile);

    logger.info(
      `New block successfully added. Your local blockchain now weighs ${size(this.chain)} bytes`
    );
  }

  isValidTransactionData({ block }: { block: Block }): boolean {
    let rewardTransactionCount = 0;
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

    return true;
  }

  static isValidBlock(incomingObj: incomingObj, localBlockchain?: IChain): boolean {
    const { timestamp, lastHash, hash, transactions, nonce, difficulty, hashOfAllHashes } =
      incomingObj.block;
    const cleanedTransactions = cleanUpTransaction({ transactions });
    const previousBlock = localBlockchain[localBlockchain.length - 1];
    const previousHash = previousBlock.hash;
    const lastDifficulty = previousBlock.difficulty;
    const validatedHash = cryptoHash(timestamp, lastHash, cleanedTransactions, nonce, difficulty);
    const hashes = cryptoHash(previousBlock.hashOfAllHashes, hash);

    console.log({ hashes, hashOfAllHashes });

    if (hashes !== hashOfAllHashes) return false;

    if (previousHash !== lastHash) return false;

    if (hash !== validatedHash) return false;

    if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW

    return true;
  }

  replaceChain(incomingChain: IChain, onSuccess?: () => void): void {
    if (
      incomingChain.length > 1 &&
      this.chain.length > 1 &&
      incomingChain.length < this.chain.length
    ) {
      console.error('The incoming chain must be longer.');
      return;
    }

    if (!Blockchain.isValidChain(incomingChain)) {
      console.error('The incoming chain must be valid.');
      return;
    }

    if (onSuccess) onSuccess();

    this.chain = incomingChain;
    logger.info(
      `Replaced your LOCAL blockchain with the incoming consensus blockchain: ${size(
        this.chain
      )} bytes`
    );
  }

  validTransactionData({ chain }: { chain: IChain }): boolean {
    for (let i = 1; i < chain.length; i++) {
      let rewardTransactionCount = 0;
      const block = chain[i];
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

  static isValidChain(chain: IChain): boolean {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i = 1; i < chain.length; i++) {
      const { timestamp, lastHash, hash, transactions, nonce, difficulty } = chain[i];
      const cleanedTransactions = cleanUpTransaction({ transactions });
      const previousHash = chain[i - 1].hash;
      const validatedHash = cryptoHash(timestamp, lastHash, cleanedTransactions, nonce, difficulty);
      const lastDifficulty = chain[i - 1].difficulty;

      if (previousHash !== lastHash) return false;

      if (hash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false; // PREVENTS DIFFICULTY JUMPS GOING TOO LOW
    }

    return true;
  }
}

export default Blockchain;
