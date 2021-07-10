import hexToBinary from 'hex-to-bin';
import Block from './block';
import { GENESIS_DATA, MINE_RATE, MINING_REWARD, sampleDataForTests } from '../config/constants';
import cryptoHash from '../util/crypto-hash';

describe('Block', () => {
  const timestamp = 2000;
  const lastHash = 'foo-last-hash';
  const hash = 'foo-hash';
  const transactions = [sampleDataForTests];
  const nonce = 1;
  const difficulty = 1;
  const block = new Block({
    timestamp,
    lastHash,
    hash,
    transactions,
    nonce,
    difficulty,
    blockSize: '999',
    totalTransactionsAmount: '999',
    blockReward: MINING_REWARD,
    blockchainHeight: 1,
  });

  it('has a timestamp, lastHash, hash, transactions, nonce, difficulty, blockSize, totalTransactionsAmount, blockReward, & blockchainHeight properties.', () => {
    expect(block).toHaveProperty('timestamp');
    expect(block).toHaveProperty('lastHash');
    expect(block).toHaveProperty('hash');
    expect(block).toHaveProperty('transactions');
    expect(block).toHaveProperty('nonce');
    expect(block).toHaveProperty('difficulty');
    expect(block).toHaveProperty('blockSize');
    expect(block).toHaveProperty('totalTransactionsAmount');
    expect(block).toHaveProperty('blockReward');
    expect(block).toHaveProperty('blockchainHeight');
  });

  describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it('returns the genesis transactions', () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  describe('mineBlock', () => {
    const lastBlock = Block.genesis();
    const transactions = [sampleDataForTests];
    const mineBlock = Block.mineBlock({ lastBlock, transactions, chain: [] });

    it('returns a Block instance', () => {
      expect(mineBlock instanceof Block).toBe(true);
    });

    it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
      expect(mineBlock.lastHash).toEqual(lastBlock.hash);
    });

    it('sets the `transactions`', () => {
      expect(mineBlock.transactions).toEqual(transactions);
    });

    it('sets a `timestamp`', () => {
      expect(mineBlock.timestamp).not.toEqual(undefined);
    });

    it('creates a SHA-256 `hash` based on the proper inputs', () => {
      expect(mineBlock.hash).toEqual(
        cryptoHash(
          mineBlock.timestamp,
          mineBlock.nonce,
          mineBlock.difficulty,
          lastBlock.hash,
          transactions
        )
      );
    });

    it('sets of `hash` that matches the difficulty criteria', () => {
      expect(hexToBinary(mineBlock.hash).substring(0, mineBlock.difficulty)).toEqual(
        '0'.repeat(mineBlock.difficulty)
      );
    });

    it('adjusts the difficulty', () => {
      const possibleResults = [lastBlock.difficulty + 1, lastBlock.difficulty - 1];
      expect(possibleResults.includes(mineBlock.difficulty)).toBe(true);
    });
  });

  describe('adjustDifficulty()', () => {
    it('raises the difficulty for a quickly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE - 100,
        })
      ).toEqual(block.difficulty + 1);
    });
    it('lowers the difficulty for a slowly mined block', () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: block.timestamp + MINE_RATE + 100,
        })
      ).toEqual(block.difficulty - 1);
    });

    it('has a lower limit of 1', () => {
      block.difficulty = -1;
      expect(Block.adjustDifficulty({ originalBlock: block, timestamp })).toEqual(1);
    });
  });

  // END BLOCK
});
