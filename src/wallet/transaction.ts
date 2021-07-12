import { v1 as uuidv1 } from 'uuid';
import { REWARD_INPUT } from '../config/constants';
import verifySignature from '../util/verifySignature';
import { isValidChecksumAddress } from '../util/pubKeyToAddress';
import {
  ICInput,
  ICInput_R,
  ICOutput,
  ICOutput_R,
  ITransaction,
  IUpdate,
  TTransactionChild,
} from '../types';
import { filterAddress } from '../util/get-only-address';
import { calcOutputTotal } from '../util/transaction-metrics';

class Transaction {
  public id: string;
  input: ICInput_R;
  output: ICOutput_R;

  constructor({
    publicKey,
    address,
    recipient,
    amount,
    output,
    input,
    balance,
    localWallet,
  }: ITransaction) {
    this.id = uuidv1();
    this.output = output || this.createOutputMap({ address, recipient, amount, balance });
    this.input =
      input || this.createInput({ publicKey, address, balance, localWallet, output: this.output });
  }

  createInput({ publicKey, balance, address, localWallet, output }: ICInput): ICInput_R {
    return {
      timestamp: Date.now(),
      amount: balance,
      address,
      publicKey,
      localPublicKey: localWallet.publicKey,
      signature: localWallet.sign(output),
    };
  }

  createOutputMap({ address, recipient, amount, balance }: ICOutput): ICOutput_R {
    const output: ICOutput_R = {} as ICOutput_R;

    output[address] = (Number(balance) - amount).toFixed(8);
    output[recipient] = amount.toFixed(8);

    return output;
  }

  update({ publicKey, recipient, amount, balance, address, localWallet }: IUpdate): void {
    amount = Number(amount);

    if (amount > Number(this.output[address])) throw new Error('Insufficient balance');

    if (!this.output[recipient]) {
      this.output[recipient] = amount.toFixed(8);
    } else {
      this.output[recipient] = (Number(this.output[recipient]) + amount).toFixed(8);
    }

    this.output[address] = (Number(this.output[address]) - amount).toFixed(8);

    this.input = this.createInput({
      publicKey,
      address,
      balance,
      localWallet,
      output: this.output,
    });
  }

  static validTransaction(transaction: TTransactionChild): boolean {
    const {
      input: { address, amount, signature, localPublicKey },
      output,
    } = transaction;

    // CHECK THAT THE SENDER STARTING BALANCE IS EQUAL TO THE TOTAL SENT AND REMAINING
    if (Number(amount) !== Number(calcOutputTotal(output))) {
      console.error(`Invalid transaction from ${address} `);
      return false;
    }

    // CHECK FOR ADDRESS VALIDITY VIA CHECKSUM
    Object.keys(output).map((address: string): boolean => {
      if (address.length == 42) {
        if (!isValidChecksumAddress(address)) {
          console.error(`Invalid address => ${address}`);
          return false;
        }
      } else if (address.length > 42) {
        if (!isValidChecksumAddress(filterAddress(address))) {
          console.error(`Invalid address => ${address}`);
          return false;
        }
      } else {
        return false;
      }
    });

    // VERIFY THAT THE SENDER CORRECTLY SIGNED THE TRANSACTION
    if (!verifySignature({ publicKey: localPublicKey, transactions: output, signature })) {
      console.error(`Invalid signature from ${localPublicKey}`);

      return false;
    }

    return true;
  }

  static rewardTransaction({
    minerPublicKey,
    message,
  }: {
    minerPublicKey: string;
    message: string;
  }): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;
    REWARD_INPUT.message = message;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: (50).toFixed(8) },
    });
  }

  // END CLASS
}

export default Transaction;
