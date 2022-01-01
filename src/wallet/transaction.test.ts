/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { REWARD_INPUT, sampleDataForTests, STARTING_BALANCE } from '../../settings';
import verifySignature from '../util/verify-signature';
import Wallet from '.';
import Transaction from './transaction';
import { calcOutputTotal } from '../util/transaction-metrics';
import Mining_Reward from '../util/supply_reward';

describe('Transaction', () => {
  let transaction: InstanceType<typeof Transaction>,
    senderWallet: Wallet,
    recipient: string,
    amount: number,
    localWallet: Wallet;

  beforeEach(() => {
    senderWallet = new Wallet();
    localWallet = new Wallet();
    recipient = 'kadocoin-recipient-address';
    amount = 500;
    transaction = new Transaction({
      amount,
      recipient,
      address: senderWallet.address,
      publicKey: senderWallet.publicKey,
      localWallet,
      balance: STARTING_BALANCE.toFixed(8),
    });
  });

  it('has an `id` property', () => expect(transaction).toHaveProperty('id'));

  describe('output', () => {
    it('has an `output` property', () => expect(transaction).toHaveProperty('output'));

    it('outputs the amount to the recipient', () =>
      expect(transaction.output[recipient]).toEqual(amount.toFixed(8)));

    it('outputs the remaining balance for the `senderWallet`', () => {
      expect(Number(transaction.output[senderWallet.address])).toEqual(
        Number(senderWallet.balance) - amount
      );
    });

    describe('input', () => {
      it('has an `input` property', () => expect(transaction).toHaveProperty('input'));

      it('has a `timestamp` property in the input', () =>
        expect(transaction.input).toHaveProperty('timestamp'));
    });

    it('sets the `amount` to the `senderWallet` balance', () =>
      expect(transaction.input.amount).toEqual(senderWallet.balance));

    it('sets the `address` to the `senderWallet` address', () =>
      expect(transaction.input.address).toEqual(senderWallet.address));

    it('signs the input', () =>
      expect(
        verifySignature({
          publicKey: localWallet.publicKey,
          output: transaction.output,
          signature: transaction.input.signature,
        })
      ).toBe(true));

    // END OUTPUT
  });

  describe('validTransaction()', () => {
    let errorMock: jest.Mock<any, any>;

    beforeEach(() => {
      errorMock = jest.fn();
      global.console.error = errorMock;
    });

    describe('when the transaction is valid', () => {
      it('returns true', () => expect(Transaction.validTransaction(transaction)).toBe(true));
    });

    describe('when the transaction is invalid', () => {
      describe('and a transaction output value is invalid', () => {
        it('returns false and logs an error', () => {
          transaction.output[senderWallet.address] = '99999999';

          expect(Transaction.validTransaction(transaction)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction input signature value is invalid', () => {
        it('returns false and logs an error', () => {
          transaction.input.signature = new Wallet().sign(sampleDataForTests.output);
          expect(Transaction.validTransaction(transaction)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });
    // END VALID-TRANSACTION()
  });

  describe('update()', () => {
    let origSignature: string,
      origSenderOutput: string | number | Wallet,
      nextRecipient: string,
      nextAmount: number;

    describe('and amount is invalid', () => {
      it('throws an error', () => {
        expect(() => {
          if (transaction instanceof Transaction) {
            transaction.update({
              localWallet,
              recipient: 'Kado',
              amount: 999999,
              address: senderWallet.address,
              balance: '300.00000000',
            });
          }
        }).toThrow('Insufficient balance');
      });
    });

    describe('and the amount is valid', () => {
      beforeEach(() => {
        origSignature = transaction.input.signature;
        origSenderOutput = transaction.output[senderWallet.address];
        nextRecipient = 'next-recipient';
        nextAmount = 50;

        if (transaction instanceof Transaction) {
          transaction.update({
            localWallet,
            recipient: nextRecipient,
            amount: nextAmount,
            address: senderWallet.address,
            balance: STARTING_BALANCE.toFixed(8),
          });
        }
      });

      it('outputs the amount to the next recipient', () => {
        expect(transaction.output[nextRecipient]).toEqual(nextAmount.toFixed(8));
      });

      it('subtracts the amount from the original sender output amount', () => {
        expect(transaction.output[senderWallet.address]).toEqual(
          ((origSenderOutput as number) - nextAmount).toFixed(8)
        );
      });

      it('maintains a total output that matches the input amount', () => {
        expect(Number(calcOutputTotal(transaction.output)).toFixed(8)).toEqual(
          transaction.input.amount
        );
      });

      it('re-signs the transaction', () => {
        expect(transaction.input.signature).not.toEqual(origSignature);
      });

      describe('and another update for the same recipient', () => {
        let addedAmount: number;

        beforeEach(() => {
          addedAmount = 80;
          transaction instanceof Transaction &&
            transaction.update({
              localWallet,
              recipient: nextRecipient,
              address: senderWallet.address,
              balance: STARTING_BALANCE.toFixed(8),
              amount: addedAmount,
            });
        });

        it('adds to the recipient amount', () => {
          expect(transaction.output[nextRecipient]).toEqual((nextAmount + addedAmount).toFixed(8));
        });

        it('subtract the amount from the original sender output amount', () => {
          expect(transaction.output[senderWallet.address]).toEqual(
            ((origSenderOutput as number) - nextAmount - addedAmount).toFixed(8)
          );
        });
      });
    });
    // END UPDATE()
  });

  describe('rewardTransaction()', () => {
    let rewardTransaction: Transaction, minerWallet: Wallet, chainLength: number;

    beforeEach(() => {
      minerWallet = new Wallet();
      chainLength = 10;
      rewardTransaction = Transaction.rewardTransaction({
        minerPublicKey: minerWallet.address,
        message: '',
        blockchainLen: chainLength,
        feeReward: '0',
      });
    });

    it('creates a transaction with the reward input', () => {
      expect(rewardTransaction.input).toEqual(REWARD_INPUT);
    });

    it('creates one transaction for the miner with the `MINING_REWARD`', () => {
      expect(rewardTransaction.output[minerWallet.address]).toEqual(
        new Mining_Reward().calc({ chainLength }).MINING_REWARD
      );
    });
  });

  // END CLASS TRANSACTION SUITE TESTS
});
