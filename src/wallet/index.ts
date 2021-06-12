import Transaction from "./transaction";
import { STARTING_BALANCE } from "../config/constants";
import { newEc, cryptoHash} from "../util";

class Wallet {
  balance: number;
  keyPair: any;
  publicKey: string;

  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = newEc.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
  }

  sign(data: any[]) {
    return this.keyPair.sign(cryptoHash(data));
  }

  createTransaction({ recipient, amount, chain }: { recipient: string; amount: number; chain: any[] }) {
    // IF CHAIN IS PASSED
    if (chain) {
      this.balance = Wallet.calculateBalance({ chain, address: this.publicKey });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds the balance.');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calculateBalance({ chain, address }: {chain: any[], address: string}) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i = chain.length - 1; i > 0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) hasConductedTransaction = true;

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal += addressOutput;
        }
      }

      if (hasConductedTransaction) break;
    }

    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
}

export default Wallet;
