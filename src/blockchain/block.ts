import hexToBinary from 'hex-to-bin';
import { GENESIS_DATA, MINE_RATE } from '../config/constants';
import { TTransactionChild, TTransactions } from '../types';
import cryptoHash from '../util/crypto-hash';
import size from '../util/size';

class Block {
  public timestamp: number;
  public lastHash: string;
  public hash: string;
  public transactions: Array<TTransactionChild>;
  public nonce: number;
  public difficulty: number;
  public blockSize: string;

  constructor({ timestamp, lastHash, hash, transactions, nonce, difficulty, blockSize }: Block) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.transactions = transactions;
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.blockSize = blockSize;
  }

  static genesis(): Block {
    return new Block(GENESIS_DATA);
  }

  static mineBlock({
    lastBlock,
    transactions,
  }: {
    lastBlock: Block;
    transactions: TTransactions;
  }): Block {
    let hash: string,
      timestamp: number,
      nonce = 0,
      { difficulty } = lastBlock;
    const lastHash = lastBlock.hash;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });
      hash = cryptoHash(timestamp, lastHash, transactions, nonce, difficulty);
    } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new Block({
      timestamp,
      lastHash,
      transactions,
      difficulty,
      nonce,
      hash,
      blockSize: size(timestamp, lastHash, transactions, difficulty, nonce, hash),
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
