/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import hexToBinary from 'hex-to-bin';
import { GENESIS_DATA, MINE_RATE } from '../config/constants';
import { IChain, TTransactions } from '../types';
import cryptoHash from '../util/crypto-hash';
import { cleanUpTransaction } from '../util/clean-up-transaction';
import size from '../util/size';
import Mining_Reward from '../util/supply_reward';
import { totalFeeReward, transactionVolume } from '../util/transaction-metrics';
import Transaction from '../wallet/transaction';

class Block {
  public timestamp: number;
  public lastHash: string;
  public hash: string;
  public transactions: Array<Transaction>;
  public nonce: number;
  public difficulty: number;
  public blockSize: string;
  public transactionVolume: string;
  public blockReward: string;
  public feeReward: string;
  public blockchainHeight: number;
  public hashOfAllHashes: string;

  constructor({
    timestamp,
    lastHash,
    hash,
    transactions,
    nonce,
    difficulty,
    blockSize,
    transactionVolume,
    blockReward,
    feeReward,
    blockchainHeight,
    hashOfAllHashes,
  }: Block) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.transactions = transactions;
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.blockSize = blockSize;
    this.transactionVolume = transactionVolume;
    this.blockReward = blockReward;
    this.feeReward = feeReward;
    this.blockchainHeight = blockchainHeight;
    this.hashOfAllHashes = hashOfAllHashes;
  }

  static genesis(): Block {
    return new Block(GENESIS_DATA);
  }

  static mineBlock({
    lastBlock,
    transactions,
    chain,
  }: {
    lastBlock: Block;
    transactions: TTransactions;
    chain: IChain;
  }): Block {
    let hash: string,
      timestamp: number,
      nonce = 0,
      { difficulty } = lastBlock;
    const lastHash = lastBlock.hash;
    const { MINING_REWARD } = new Mining_Reward().calc({ chainLength: chain.length });
    const feeReward = totalFeeReward({ transactions });
    const cleanedTransactions = cleanUpTransaction({ transactions });

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });

      hash = cryptoHash(timestamp, lastHash, cleanedTransactions, nonce, difficulty);
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    const hashOfAllHashes = cryptoHash(lastBlock.hashOfAllHashes, hash);

    return new Block({
      timestamp,
      lastHash,
      transactions,
      difficulty,
      nonce,
      hash,
      blockSize: size(timestamp, lastHash, transactions, difficulty, nonce, hash, hashOfAllHashes),
      transactionVolume: transactionVolume({ transactions }),
      blockReward: MINING_REWARD,
      feeReward,
      blockchainHeight: chain.length + 1 /** 1 is the GENESIS BLOCK*/,
      hashOfAllHashes,
    });
  }

  static adjustDifficulty({
    originalBlock,
    timestamp,
  }: {
    originalBlock: Block;
    timestamp: number;
  }): number {
    const { difficulty } = originalBlock;

    if (difficulty < 1) return 1;

    if (timestamp - originalBlock.timestamp > MINE_RATE) return difficulty - 1;

    return difficulty + 1;
  }

  // END CLASS
}

export default Block;
