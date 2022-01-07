/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Block from './block';
import cryptoHash from '../util/crypto-hash';
import { blockchainStorageFile, MAX_WEIGHT_TXN, REWARD_INPUT } from '../settings';
import Transaction from '../wallet/transaction';
import { IChain, incomingObj, TTransactions } from '../types';
import size from '../util/size';
import Mining_Reward from '../util/supply_reward';
import { totalFeeReward } from '../util/transaction-metrics';
import { cleanUpTransaction } from '../util/clean-up-transaction';
import { KADOCOIN_VERSION } from '../settings';
import fs from 'fs';
import getFileContentLineByLine from '../util/get-file-content-line-by-line';
import logger from '../util/logger';
import LevelDB from '../db';

class Blockchain {
  public chain: IChain;
  public leveldb: LevelDB;

  constructor({ chain, leveldb }: { chain?: IChain; leveldb?: LevelDB } = {}) {
    this.chain = chain && chain.length ? chain : [Block.genesis()];
    this.leveldb = leveldb;
  }

  async loadBlocksFromFileOrCreateNew(): Promise<Blockchain> {
    if (fs.existsSync(blockchainStorageFile)) {
      const chain = await getFileContentLineByLine(blockchainStorageFile);
      return new Blockchain({ chain });
    }

    return new Blockchain();
  }

  public async addBlock({ transactions }: { transactions: TTransactions }): Promise<Block> {
    const previousBlock = await this.leveldb.getLastValidatedBlock();
    const height = await this.leveldb.getLocalHighestBlockchainHeight();

    const newlyMinedBlock = Block.mineBlock({
      lastBlock: previousBlock,
      transactions,
      height,
    });

    return newlyMinedBlock;
  }

  async addBlockFromPeerToLocal(
    incomingObj: incomingObj,
    validateTransactions?: boolean,
    onSuccess?: () => void
  ): Promise<void> {
    const bestHeight = await this.leveldb.getLocalHighestBlockchainHeight();

    if (incomingObj.info.height < bestHeight) {
      console.error('The incoming chain must be longer.');
      return;
    }

    const previousBlock = await this.leveldb.getLastValidatedBlock();

    if (!Blockchain.isValidBlock(incomingObj, previousBlock)) {
      console.error('The incoming block is not valid.');
      return;
    }

    if (
      validateTransactions &&
      !this.isValidTransactionData({ block: incomingObj.block, bestHeight })
    ) {
      console.error('The incoming block has an invalid transaction');
      return;
    }
    // CHECK VERSION COMPATIBILITY
    if (incomingObj.info.KADOCOIN_VERSION != KADOCOIN_VERSION) {
      console.error('The incoming block has an invalid VERSION');
      return;
    }

    if (onSuccess) onSuccess();

    // SAVE TO DB
    await new Promise(async (resolve: (value: { type: string; message: string }) => void) =>
      resolve(await this.leveldb.addBlocksToDB({ blocks: [incomingObj.block] }))
    );

    logger.info(
      `New block successfully added. Your local blockchain now weighs ${size(this.chain)} bytes`
    );
  }

  isValidTransactionData({ block, bestHeight }: { block: Block; bestHeight: number }): boolean {
    let rewardTransactionCount = 0;
    const transactionSet = new Set();
    const feeReward = totalFeeReward({ transactions: block.transactions });
    const { MINING_REWARD } = new Mining_Reward().calc({ chainLength: bestHeight });
    const totalReward = (Number(MINING_REWARD) + Number(feeReward)).toFixed(8);
    let weight = 0;

    for (const transaction of block.transactions) {
      console.log({ inputAddr: transaction.input.address, rewardAddr: REWARD_INPUT.address });
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

      weight += Number(size(transaction));
    }

    // CHECK FOR TRANSACTIONS LIMIT
    if (weight > MAX_WEIGHT_TXN) {
      console.error('Transactions exceeds limit.');
      return false;
    }

    logger.info('Block Transactions weight', { weight });

    return true;
  }

  static isValidBlock(incomingObj: incomingObj, previousBlock?: Block): boolean {
    console.log('147', { previousBlock });
    const { timestamp, lastHash, hash, transactions, nonce, difficulty, hashOfAllHashes } =
      incomingObj.block;
    const cleanedTransactions = cleanUpTransaction({ transactions });
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

  // TODO - REMOVE?
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

  // TODO - REMOVE?
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
