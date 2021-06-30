import hexToBinary from "hex-to-bin";
import { GENESIS_DATA, MINE_RATE } from "../config/constants";
import { TDataChild } from "../types";
import cryptoHash from "../util/crypto-hash";

class Block {
  public timestamp: number;
  public lastHash: string;
  public hash: string;
  public data: Array<TDataChild>;
  public nonce: number;
  public difficulty: number;

  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }: Block) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis(): Block {
    return new Block(GENESIS_DATA);
  }

  static minedBlock({
    lastBlock,
    data,
  }: {
    lastBlock: Block;
    data: any[];
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
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== "0".repeat(difficulty)
    );

    return new Block({
      timestamp,
      lastHash,
      data,
      difficulty,
      nonce,
      hash,
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
