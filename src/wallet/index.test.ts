/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Blockchain from '../blockchain';
import { sampleDataForTests, STARTING_BALANCE } from '../config/constants';
import verifySignature from '../util/verifySignature';
import Wallet from './index';
import Transaction from './transaction';

describe('Wallet', () => {
  let wallet: Wallet, localWallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet();
    localWallet = new Wallet();
  });

  /**
   * WALLET CLASS PROPERTIES TESTS
   */

  it('has a `balance`', () => expect(wallet).toHaveProperty('balance'));
  it('has a `publicKey`', () => expect(wallet).toHaveProperty('publicKey'));
  it('has an `address`', () => expect(wallet).toHaveProperty('address'));
  it('has an `keyPair`', () => expect(wallet).toHaveProperty('keyPair'));

  /**
   * WALLET CLASS METHODS TESTS
   */

  describe('signing transactions', () => {
    const transactions = [sampleDataForTests];

    it('verifies a signature', () =>
      expect(
        verifySignature({
          publicKey: localWallet.publicKey,
          transactions: transactions,
          signature: localWallet.sign(transactions),
        })
      ).toBe(true));

    it('does not verify an invalid signature', () =>
      expect(
        verifySignature({
          publicKey: localWallet.publicKey,
          transactions: transactions,
          signature: new Wallet().sign(transactions),
        })
      ).toBe(false));
  });

  describe('createTransaction()', () => {
    describe('and the amount exceeds the balance', () => {
      it('throws an error', () =>
        expect(() =>
          wallet.createTransaction({ amount: 1001, recipient: 'anyone', sendFee: '2' })
        ).toThrow('Insufficient balance'));
    });

    describe('and the amount is valid', () => {
      let transaction: Transaction, amount: number, recipient: string;

      beforeEach(() => {
        amount = 50;
        recipient = 'kadocoin user address';
        transaction = wallet.createTransaction({ amount, recipient, sendFee: '2' });
      });

      it('creates an instance of `Transaction`', () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it('matches the transaction input `localPublicKey` with the wallet publicKey', () => {
        expect(transaction.input.localPublicKey).toEqual(wallet.publicKey);
      });

      it('outputs the amount to the recipient', () => {
        expect(transaction.output[recipient]).toEqual(amount.toFixed(8));
      });
    });

    describe('and a chain is passed', () => {
      it('calls `Wallet.calculateBalance()`', () => {
        const calculateBalanceMock = jest.fn();
        const originalCalculateBalance = Wallet.calculateBalance;

        Wallet.calculateBalance = calculateBalanceMock;

        wallet.createTransaction({
          recipient: 'kadocoin user address',
          amount: 10,
          chain: new Blockchain().chain,
          sendFee: '2',
        });

        expect(calculateBalanceMock).toHaveBeenCalled();

        Wallet.calculateBalance = originalCalculateBalance;
      });
    });
    // END OF createTransaction()
  });

  describe('calculateBalance()', () => {
    let blockchain: Blockchain;

    beforeEach(() => {
      blockchain = new Blockchain();
    });

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.address,
          })
        ).toEqual(STARTING_BALANCE.toFixed(8));
      });
    });

    describe('and there are outputs for the wallet', () => {
      let transactionOne: Transaction, transactionTwo: Transaction;

      beforeEach(() => {
        transactionOne = new Wallet().createTransaction({
          recipient: wallet.address,
          amount: 50,
          sendFee: '2',
        });

        transactionTwo = new Wallet().createTransaction({
          recipient: wallet.address,
          amount: 60,
          sendFee: '2',
        });

        blockchain.addBlock({ transactions: [transactionOne, transactionTwo] });
      });

      it('adds the sum of all outputs to the wallet balance', () => {
        expect(
          Wallet.calculateBalance({
            chain: blockchain.chain,
            address: wallet.address,
          })
        ).toEqual(
          (
            STARTING_BALANCE +
            Number(transactionOne.output[wallet.address]) +
            Number(transactionTwo.output[wallet.address])
          ).toFixed(8)
        );
      });

      describe('and the wallet has made a transaction', () => {
        let recentTransaction: Transaction;

        beforeEach(() => {
          recentTransaction = wallet.createTransaction({
            recipient: 'Kado',
            amount: 30,
            publicKey: wallet.publicKey,
            address: wallet.address,
            sendFee: '2',
          });

          blockchain.addBlock({ transactions: [recentTransaction] });
        });

        it('returns the remaining output amount after the recent transaction', () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.address,
            })
          ).toEqual(recentTransaction.output[wallet.address]);
        });

        describe('and there are outputs next to and after the recent transaction', () => {
          let sampleBlockTransaction: Transaction, nextBlockTransaction: Transaction;
          const senderWallet: Wallet = new Wallet();

          beforeEach(() => {
            recentTransaction = wallet.createTransaction({
              recipient: 'Kado-after',
              amount: 60,
              publicKey: wallet.address,
              address: wallet.address,
              sendFee: '2',
            });

            sampleBlockTransaction = Transaction.rewardTransaction({
              minerPublicKey: wallet.address,
              message: '',
              chainLength: 999,
              msgReward: '12',
              feeReward: '2',
            });

            blockchain.addBlock({
              transactions: [recentTransaction, sampleBlockTransaction],
            });

            nextBlockTransaction = senderWallet.createTransaction({
              recipient: wallet.address,
              amount: 75,
              publicKey: senderWallet.address,
              address: senderWallet.address,
              sendFee: '2',
            });

            blockchain.addBlock({ transactions: [nextBlockTransaction] });
          });

          it('includes the output amounts in the returned balance', () => {
            expect(
              Wallet.calculateBalance({
                chain: blockchain.chain,
                address: wallet.address,
              })
            ).toEqual(
              (
                Number(recentTransaction.output[wallet.address]) +
                Number(sampleBlockTransaction.output[wallet.address]) +
                Number(nextBlockTransaction.output[wallet.address])
              ).toFixed(8)
            );
          });
        });
      });
    });
  });
  // END OF WALLET TEST SUITE
});
