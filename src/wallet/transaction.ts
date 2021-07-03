import { v1 as uuidv1 } from 'uuid';
import { REWARD_INPUT, MINING_REWARD } from '../config/constants';
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
    message,
  }: ITransaction) {
    this.id = uuidv1();
    this.output = output || this.createOutputMap({ address, recipient, amount, balance });
    this.input =
      input ||
      this.createInput({ publicKey, address, balance, localWallet, output: this.output, message });
  }

  createInput({ publicKey, balance, address, localWallet, output, message }: ICInput): ICInput_R {
    return {
      timestamp: Date.now(),
      amount: balance,
      address,
      publicKey,
      localPublicKey: localWallet.publicKey,
      signature: localWallet.sign(output),
      message,
    };
  }

  createOutputMap({ address, recipient, amount, balance }: ICOutput): ICOutput_R {
    const output: ICOutput_R = {} as ICOutput_R;

    output[address] = (Number(balance) - amount).toFixed(8);
    output[recipient] = amount.toFixed(8);

    return output;
  }

  static validTransaction(transaction: TTransactionChild): boolean {
    const {
      input: { address, publicKey, amount, signature, localPublicKey },
      output,
    } = transaction;

    let outputTotal = Object.values(output).reduce(
      (total: any, outputAmount: any) => Number(total) + Number(outputAmount),
      0
    );

    // CONVERT THE SUM TO 8 DECIMAL PLACES
    if (typeof outputTotal == 'number') outputTotal = outputTotal.toFixed(8);

    // CHECK THAT THE SENDER STARTING BALANCE IS EQUAL TO THE TOTAL SENT AND REMAINING
    if (Number(amount) !== Number(outputTotal)) {
      console.error(`Invalid transaction from ${address} ${publicKey}`);
      return false;
    }

    // CHECK FOR ADDRESS VALIDITY VIA CHECKSUM
    Object.keys(output).map((address: string): boolean => {
      if (!isValidChecksumAddress(address)) {
        console.error(`Invalid address => ${address}`);
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

  update({ publicKey, recipient, amount, balance, address, localWallet, message }: IUpdate): void {
    // CONVERT THE NUMBERS IN STRING FORM TO NUMBERS

    if (amount > Number(this.output[address])) {
      throw new Error('Insufficient balance');
    }

    // MAKE SURE TO CONVERT THE NUMBERS BACK TO THEIR STRING FORM
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
      message,
    });
  }

  static rewardTransaction({ minerPublicKey }: { minerPublicKey: string }): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
