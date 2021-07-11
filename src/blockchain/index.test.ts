import { sampleDataForTests } from '../config/constants';
import cryptoHash from '../util/crypto-hash';
import Block from './block';
import Blockchain from '.';
import Wallet from '../wallet';
import Transaction from '../wallet/transaction';
import { IChain, TTransactionChild } from '../types';

describe('Blockchain', () => {
  let blockchain: Blockchain,
    newChain: Blockchain,
    originalChain: IChain,
    errorMock: jest.Mock<any, any>;

  beforeEach(() => {
    blockchain = new Blockchain();
    newChain = new Blockchain();
    errorMock = jest.fn();

    originalChain = blockchain.chain;
    global.console.error = errorMock;
  });

  it('contains a `chain` array instance', () => {
    expect(blockchain.chain instanceof Array).toBe(true);
  });

  it('starts with the genesis block', () => {
    expect(blockchain.chain[0]).toEqual(Block.genesis());
  });

  it('adds a new block to the chain', () => {
    const newData = [sampleDataForTests];
    blockchain.addBlock({ transactions: newData });

    expect(blockchain.chain[blockchain.chain.length - 1].transactions).toEqual(newData);
  });

  describe('isValidChain()', () => {
    describe('when the chain does not start with the genesis block', () => {
      it('returns false', () => {
        blockchain.chain[0] = {
          timestamp: 2,
          lastHash: 'lastHash',
          hash: 'hash-one',
          transactions: [],
          nonce: 2,
          difficulty: 1,
          blockSize: '999',
          totalTransactionsAmount: '999',
          blockReward: '2',
          blockchainHeight: newChain.chain.length,
          msgReward: '1',
          feeReward: '2',
        };

        expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe('when the chain starts with the genesis block and has multiple blocks', () => {
      beforeEach(() => {
        blockchain.addBlock({ transactions: [sampleDataForTests] });
        blockchain.addBlock({ transactions: [sampleDataForTests] });
        blockchain.addBlock({ transactions: [sampleDataForTests] });
      });

      describe('and a lastHash reference has changed.', () => {
        it('returns false', () => {
          blockchain.chain[2].lastHash = 'broken-lastHash';

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with an invalid field', () => {
        it('returns false', () => {
          sampleDataForTests.id = 'bad id';
          blockchain.chain[2].transactions = [sampleDataForTests];

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain contains a block with a jumped difficulty', () => {
        it('returns false', () => {
          const lastBlock = blockchain.chain[blockchain.chain.length - 1];
          const lastHash = lastBlock.hash;
          const timestamp = Date.now();
          const nonce = 0;
          const transactions: Array<TTransactionChild> = [];
          const difficulty = lastBlock.difficulty - 3;
          const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, transactions);
          const badBlock = new Block({
            timestamp,
            lastHash,
            hash,
            nonce,
            difficulty,
            transactions,
            blockSize: '999',
            totalTransactionsAmount: '999',
            blockReward: '2',
            blockchainHeight: newChain.chain.length,
            msgReward: '4',
            feeReward: '3',
          });

          blockchain.chain.push(badBlock);

          expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
        });
      });

      describe('and the chain does not contain any invalid blocks', () => {
        it('returns true', () => {
          expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
        });
      });
      // END starts with the genesis block and has multiple blocks
    });

    // END isValidChain()
  });

  describe('replaceChain()', () => {
    let logMock: jest.Mock<any, any>;

    beforeEach(() => {
      logMock = jest.fn();
      global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {
      beforeEach(() => {
        newChain.chain[0] = {
          timestamp: 1,
          lastHash: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
          hash: '0x86045b56bfeb1A35C6818081130BA0F789dc27c9',
          transactions: [],
          nonce: 0,
          difficulty: 3,
          blockSize: '999',
          totalTransactionsAmount: '999',
          blockReward: '2',
          blockchainHeight: newChain.chain.length,
          msgReward: '3',
          feeReward: '3',
        };

        blockchain.replaceChain(newChain.chain);
      });

      it('does not replace the chain', () => {
        expect(blockchain.chain).toEqual(originalChain);
      });

      it('logs an error', () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('when the chain is longer', () => {
      beforeEach(() => {
        newChain.addBlock({ transactions: [sampleDataForTests] });
        newChain.addBlock({ transactions: [sampleDataForTests] });
        newChain.addBlock({ transactions: [sampleDataForTests] });
      });
      describe('and the chain is invalid', () => {
        beforeEach(() => {
          newChain.chain[2].hash = 'invalid hash';
          blockchain.replaceChain(newChain.chain);
        });

        it('does not replace the chain', () => {
          expect(blockchain.chain).toEqual(originalChain);
        });

        it('logs an error', () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });
      describe('and the chain is valid', () => {
        beforeEach(() => {
          blockchain.replaceChain(newChain.chain);
        });
        it('replaces the chain', () => {
          expect(blockchain.chain).toEqual(newChain.chain);
        });

        it('logs about the chain replacement', () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the `validateTransactions` flag i true', () => {
      it('calls validateTransactionData()', () => {
        const validateTransactionDataMock = jest.fn();

        blockchain.validTransactionData = validateTransactionDataMock;

        newChain.addBlock({ transactions: [sampleDataForTests] });
        blockchain.replaceChain(newChain.chain, true);

        expect(validateTransactionDataMock).toHaveBeenCalled();
      });
    });
  });

  describe('validTransactionData()', () => {
    let transaction: Transaction, rewardTransaction: Transaction, wallet: Wallet;

    beforeEach(() => {
      wallet = new Wallet();

      transaction = wallet.createTransaction({
        recipient: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD',
        amount: 65,
        address: wallet.address,
        publicKey: wallet.publicKey,
      });

      rewardTransaction = Transaction.rewardTransaction({
        minerPublicKey: wallet.publicKey,
        message: '',
        chainLength: 3,
        feeReward: '3',
        msgReward: '4',
      });
    });

    // describe('and transaction transactions is valid', () => {
    //   it('returns true', () => {
    //     newChain.addBlock({ transactions: [transaction, rewardTransaction] });

    //     expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
    //     expect(errorMock).not.toHaveBeenCalled();
    //   });
    // });

    describe('and the transaction transactions has multiple rewards', () => {
      it('returns false and logs and error', () => {
        newChain.addBlock({
          transactions: [transaction, rewardTransaction, rewardTransaction],
        });
        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and the transaction transactions has at least one malformed output', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false and logs and error', () => {
          transaction.output[wallet.address] = 999999;

          newChain.addBlock({ transactions: [transaction, rewardTransaction] });

          expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction is a reward transaction', () => {
        it('returns false and logs and error', () => {
          rewardTransaction.output[wallet.publicKey] = 999999;

          newChain.addBlock({ transactions: [transaction, rewardTransaction] });

          expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and a block contains multiple identical transaction', () => {
      it('returns false and logs an error', () => {
        newChain.addBlock({
          transactions: [transaction, transaction, transaction],
        });

        expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });
  });
});
