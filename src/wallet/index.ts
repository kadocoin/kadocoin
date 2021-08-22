/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Transaction from './transaction';
import { NOT_ENOUGH, STARTING_BALANCE } from '../config/constants';
import newEc from '../util/secp256k1';
import cryptoHash from '../util/crypto-hash';
import { pubKeyToAddress } from '../util/pubKeyToAddress';
import { IChain, ICOutput_R, ICreateTransactionParams } from '../types';

class Wallet {
  public balance: string;
  public keyPair: any;
  public publicKey: string;
  public address: string;

  constructor() {
    this.balance = STARTING_BALANCE.toFixed(8);
    this.keyPair = newEc.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
    this.address = pubKeyToAddress(this.publicKey);
  }

  sign(output: ICOutput_R): string {
    return this.keyPair.sign(cryptoHash(output));
  }

  createTransaction({
    recipient,
    amount,
    chain,
    publicKey,
    address,
    message,
    sendFee,
  }: ICreateTransactionParams): Transaction {
    const send_fee = sendFee ? Number(sendFee) : 0;
    const totalAmount = send_fee + amount;
    // IF CHAIN IS PASSED
    if (chain) this.balance = Wallet.calculateBalance({ chain, address });

    // CHECK TO MAKE SURE SENDER HAS ENOUGH COINS
    if (totalAmount > Number(this.balance)) throw new Error(NOT_ENOUGH);

    return new Transaction({
      recipient,
      publicKey,
      address,
      amount,
      balance: this.balance,
      localWallet: this,
      message,
      sendFee,
    });
  }

  static calculateBalance({ chain, address }: { chain: IChain; address: string }): string {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (const transaction of block.transactions) {
        if (transaction.input.address === address) hasConductedTransaction = true;

        const addressOutput = Number(transaction.output[address]);

        if (addressOutput) outputsTotal += addressOutput;
      }

      if (hasConductedTransaction) break;
    }

    return hasConductedTransaction
      ? outputsTotal.toFixed(8)
      : (STARTING_BALANCE + outputsTotal).toFixed(8);
  }
  static calculateTotalSentAndReceived({ chain, address }: { chain: IChain; address: string }): {
    numTransactionsInitiated: number;
    totalSent: string;
    totalReceived: string;
    totalFeesPaid: string;
    balance: string;
    address: string;
  } {
    let numTransactionsInitiated = 0,
      totalSent = 0,
      totalReceived = 0,
      totalFeesPaid = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (const transaction of block.transactions) {
        // TOTAL SENT
        if (transaction.input.address === address) {
          numTransactionsInitiated += 1;

          const amountSent = Number(transaction.input.amount) - Number(transaction.output[address]);
          const feesPaid = Number(transaction.input.sendFee);

          totalSent += amountSent;
          totalFeesPaid += feesPaid;
        }
        // TOTAL RECEIVED
        const outputAddresses = Object.keys(transaction.output);

        for (let i = 0; i < outputAddresses.length; i++) {
          if (transaction.input.address != '' && transaction.input.address !== outputAddresses[i]) {
            address == outputAddresses[i] &&
              (totalReceived += Number(transaction.output[outputAddresses[i]]));
          }
          if (transaction.input.address == '' && transaction.input.recipient == address) {
            totalReceived += Number(transaction.output[outputAddresses[i]]);
          }
        }
      }
    }

    return {
      numTransactionsInitiated: numTransactionsInitiated,
      totalSent: totalSent.toFixed(8),
      totalFeesPaid: totalFeesPaid.toFixed(8),
      totalReceived: totalReceived.toFixed(8),
      balance: Wallet.calculateBalance({ chain, address }),
      address,
    };
  }

  // END CLASS
}

export default Wallet;
