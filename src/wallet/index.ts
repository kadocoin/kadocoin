import Transaction from "./transaction";
import { STARTING_BALANCE } from "../config/constants";
import { newEc, cryptoHash } from "../util";
import pubKeyToAddress from "../util/pubKeyToAddress";

class Wallet {
  balance: number;
  keyPair: any;
  publicKey: string;
  address: string;

  constructor() {
    this.balance = STARTING_BALANCE;
    this.keyPair = newEc.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode("hex");
    this.address = pubKeyToAddress(this.publicKey);
  }

  sign(data: any[]) {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({
    recipient,
    amount,
    chain,
    publicKey,
  }: {
    recipient: string;
    amount: number;
    chain: any[];
    publicKey: string;
  }) {
    // IF CHAIN IS PASSED
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: publicKey,
      }) as number;
    }

    if (amount > this.balance) {
      throw new Error("Insufficient balance.");
    }

    return new Transaction({
      publicKey,
      recipient,
      amount,
      balance: this.balance,
      localWallet: this,
    });
  }

  static calculateBalance({
    chain,
    address,
  }: {
    chain: any[];
    address: string;
  }): number | string {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    // TODO: CHECK IF VALID ADDRESS
    try {
      newEc.keyFromPublic(address, "hex");
    } catch (error) {
      return "Invalid public key" as string;
    }

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (const transaction of block.data) {
        if (transaction.input.address === address)
          hasConductedTransaction = true;

        const addressOutput = transaction.outputMap[address];

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
