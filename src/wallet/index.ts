import Transaction from './transaction';
import { NOT_ENOUGH, STARTING_BALANCE } from '../config/constants';
import newEc from '../util/secp256k1';
import cryptoHash from '../util/crypto-hash';
import { pubKeyToAddress } from '../util/pubKeyToAddress';
import { IChain, ICOutput_R, TTransactionChild } from '../types';
import costOfMessage from '../util/text-2-coins';

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

  sign(transactions: Array<TTransactionChild> | ICOutput_R): string {
    return this.keyPair.sign(cryptoHash(transactions));
  }

  createTransaction({
    recipient,
    amount,
    chain,
    publicKey,
    address,
    message,
  }: {
    recipient: string;
    amount: number;
    chain?: IChain;
    publicKey?: string;
    address?: string;
    message?: string;
  }): Transaction {
    // IF CHAIN IS PASSED
    if (chain) this.balance = Wallet.calculateBalance({ chain, address: address });

    const totalAmount = amount + costOfMessage({ message });

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

        if (addressOutput) {
          outputsTotal += addressOutput;
        }
      }

      if (hasConductedTransaction) break;
    }

    return hasConductedTransaction
      ? outputsTotal.toFixed(8)
      : (STARTING_BALANCE + outputsTotal).toFixed(8);
  }
}

export default Wallet;
