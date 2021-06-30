/* eslint-disable @typescript-eslint/no-explicit-any */
import Transaction from "./transaction";
import { STARTING_BALANCE } from "../config/constants";
import newEc from "../util/secp256k1";
import cryptoHash from "../util/crypto-hash";
import { pubKeyToAddress } from "../util/pubKeyToAddress";
import { IChain, ICreateOutputParams } from "../types";

class Wallet {
  public balance: string | number;
  public keyPair: any;
  public publicKey: string;
  public address: string;

  constructor() {
    this.balance = STARTING_BALANCE.toFixed(8);
    this.keyPair = newEc.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode("hex");
    this.address = pubKeyToAddress(this.publicKey);
  }

  sign(data: ICreateOutputParams): string {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({
    recipient,
    amount,
    chain,
    publicKey,
    address,
  }: {
    recipient: string;
    amount: number;
    chain?: IChain;
    publicKey?: string;
    address?: string;
  }): Transaction {
    // IF CHAIN IS PASSED
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address,
      }) as number;
    }

    if (amount > Number(this.balance)) {
      throw new Error("Insufficient balance");
    }

    return new Transaction({
      recipient,
      publicKey,
      address,
      amount,
      balance: this.balance,
      localWallet: this,
    });
  }

  static calculateBalance({
    chain,
    address,
  }: {
    chain: IChain;
    address: string;
  }): number | string {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (const transaction of block.data) {
        if (transaction.input.address === address)
          hasConductedTransaction = true;

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
