import hexToBinary from 'hex-to-bin';
import { GENESIS_DATA, MINE_RATE } from '../config/constants';
import { IChain, TTransactionChild, TTransactions } from '../types';
import cryptoHash from '../util/crypto-hash';
import size from '../util/size';
import Mining_Reward from '../util/supply_reward';
import { totalMsgReward, totalTransactionsAmountInBlock } from '../util/transaction-metrics';

class Block {
  public timestamp: number;
  public lastHash: string;
  public hash: string;
  public transactions: Array<TTransactionChild>;
  public nonce: number;
  public difficulty: number;
  public blockSize: string;
  public totalTransactionsAmount: string;
  public blockReward: string;
  public msgReward: string;
  public blockchainHeight: number;

  constructor({
    timestamp,
    lastHash,
    hash,
    transactions,
    nonce,
    difficulty,
    blockSize,
    totalTransactionsAmount,
    blockReward,
    msgReward,
    blockchainHeight,
  }: Block) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.transactions = transactions;
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.blockSize = blockSize;
    this.totalTransactionsAmount = totalTransactionsAmount;
    this.blockReward = blockReward;
    this.msgReward = msgReward;
    this.blockchainHeight = blockchainHeight;
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

    const totalTransactionsAmount = totalTransactionsAmountInBlock({ transactions });
    const msgReward = totalMsgReward({ transactions });
    const blockchainHeight = chain.length + 1; /** 1 is the GENESIS BLOCK*/
    const blockSize = size(
      timestamp,
      lastHash,
      transactions,
      difficulty,
      nonce,
      hash,
      totalTransactionsAmount,
      msgReward,
      blockchainHeight
    );

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });

      hash = cryptoHash(
        lastHash,
        totalTransactionsAmount,
        transactions,
        difficulty,
        nonce,
        timestamp,
        msgReward
      );
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new Block({
      timestamp,
      lastHash,
      transactions,
      difficulty,
      nonce,
      hash,
      blockSize,
      totalTransactionsAmount,
      blockReward: MINING_REWARD,
      msgReward,
      blockchainHeight,
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
