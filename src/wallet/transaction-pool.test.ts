/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
import Blockchain from '../blockchain';
import Wallet from '.';
import Transaction from './transaction';
import TransactionPool from './transaction-pool';
import { sampleDataForTests } from '../config/constants';

describe('TransactionPool', () => {
  let transactionPool: TransactionPool,
    transaction: InstanceType<typeof Transaction>,
    senderWallet: Wallet;

  beforeAll(() => {
    senderWallet = new Wallet();
    transactionPool = new TransactionPool();
    transaction = new Transaction({
      address: senderWallet.address,
      recipient: 'someone',
      amount: 50,
      localWallet: new Wallet(),
    });
  });

  describe('setTransaction()', () => {
    it('adds a transaction', () => {
      transactionPool.setTransaction(transaction);

      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
    });
  });

  describe('existingTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction);

      expect(
        transactionPool.existingTransactionPool({
          inputAddress: senderWallet.address,
        })
      ).toBe(transaction);
    });
  });

  describe('validTransaction', () => {
    let validTransactions: Array<Transaction>, errorMock: jest.Mock<any, any>;
    const localWallet = new Wallet();

    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();
      global.console.error = errorMock;

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          publicKey: senderWallet.publicKey,
          address: senderWallet.address,
          localWallet: localWallet,
          recipient: 'someone',
          amount: 30,
          balance: senderWallet.balance,
        });

        if (i % 3 === 0) {
          transaction.input.amount = '999999';
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign([sampleDataForTests]);
        } else {
          validTransactions.push(transaction);
        }

        transactionPool.setTransaction(transaction);
      }
    });

    it('returns valid transaction', () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });

    it('logs errors for the invalid transactions', () => {
      transactionPool.validTransactions();
      expect(errorMock).toHaveBeenCalled();
    });
  });

  describe('clear()', () => {
    it('clears the transactions', () => {
      transactionPool.clear();

      expect(transactionPool.transactionMap).toEqual({});
    });
  });

  describe('clearBlockchainTransactions()', () => {
    it('clears the pool of any existing blockchain transactions', () => {
      const blockchain = new Blockchain();
      const expectedTransactionMap: { [key: string]: string | Transaction } = {};

      for (let i = 0; i < 6; i++) {
        const transaction = new Wallet().createTransaction({
          recipient: 'Kado',
          amount: 20,
          sendFee: '2',
        });
        transactionPool.setTransaction(transaction);

        if (i % 2) {
          blockchain.addBlock({ transactions: [transaction] });
        } else {
          expectedTransactionMap[transaction.id] = transaction;
        }

        transactionPool.clearBlockchainTransactions({
          chain: blockchain.chain,
        });

        expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
      }
    });
  });

  // END TRANSACTION-POOL CLASS
});
