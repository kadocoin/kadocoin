/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import hexToBinary from 'hex-to-bin';
import Block from './block';
import { GENESIS_DATA, MINE_RATE, sampleDataForTests } from '../config/constants';
import cryptoHash from '../util/crypto-hash';
import Transaction from '../wallet/transaction';
import { cleanUpTransaction } from '../util/clean-up-transaction';

describe('Block', () => {
  const timestamp = 2000;
  const lastHash = 'foo-last-hash';
  const hash = 'foo-hash';
  const sampleData = new Transaction({
    id: sampleDataForTests.id,
    output: sampleDataForTests.output,
    input: sampleDataForTests.input,
  });
  const transactions = [sampleData];
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
    transactionVolume: '999',
    blockReward: (50).toFixed(8),
    blockchainHeight: 1,
  });

  it('has a timestamp, lastHash, hash, transactions, nonce, difficulty, blockSize, transactionVolume, blockReward, & blockchainHeight properties.', () => {
    expect(block).toHaveProperty('timestamp');
    expect(block).toHaveProperty('lastHash');
    expect(block).toHaveProperty('hash');
    expect(block).toHaveProperty('transactions');
    expect(block).toHaveProperty('nonce');
    expect(block).toHaveProperty('difficulty');
    expect(block).toHaveProperty('blockSize');
    expect(block).toHaveProperty('transactionVolume');
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
    const sampleData = new Transaction({
      id: sampleDataForTests.id,
      output: sampleDataForTests.output,
      input: sampleDataForTests.input,
    });
    const transactions = [sampleData];

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
          mineBlock.lastHash,
          cleanUpTransaction({ transactions }),
          mineBlock.nonce,
          mineBlock.difficulty
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
