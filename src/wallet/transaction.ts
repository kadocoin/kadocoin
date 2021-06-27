/* eslint-disable @typescript-eslint/no-explicit-any */
import { v1 as uuidv1 } from "uuid";
import { REWARD_INPUT, MINING_REWARD } from "../config/constants";
import verifySignature from "../util/verifySignature";
import { isValidChecksumAddress } from "../util/pubKeyToAddress";
import {
  ICreateInputParams,
  ICreateOutputParams,
  IInput,
  ITransactionClassParams,
  TOutput,
} from "../types";

class Transaction {
  public id: string;
  public output: TOutput;
  public input: ICreateInputParams;

  constructor({
    publicKey,
    address,
    recipient,
    amount,
    output,
    input,
    balance,
    localWallet,
  }: ITransactionClassParams) {
    this.id = uuidv1();
    this.output =
      output || this.createOutputMap({ address, recipient, amount, balance });
    this.input =
      input ||
      this.createInput({
        publicKey,
        address,
        balance,
        localWallet,
        output: this.output,
      });
  }

  createOutputMap({
    address,
    recipient,
    amount,
    balance,
  }: ICreateOutputParams): TOutput {
    const output = { address: "", recipient: "" };

    output[address] = ((balance as number) - amount).toFixed(8);
    output[recipient] = amount.toFixed(8);

    return output;
  }

  createInput({
    publicKey,
    balance,
    address,
    localWallet,
    output,
  }: ICreateInputParams): IInput {
    return {
      timestamp: Date.now(),
      amount: balance as number,
      address,
      publicKey,
      localPublicKey: localWallet.publicKey,
      signature: localWallet.sign(output),
    };
  }

  static validTransaction(transaction: ITransactionClassParams): boolean {
    const {
      input: { address, publicKey, amount, signature, localPublicKey },
      output,
    } = transaction;

    const outputTotal = Object.values(output).reduce(
      (total: any, outputAmount: any) => Number(total) + Number(outputAmount)
    );

    // CHECK THAT THE SENDER STARTING BALANCE IS EQUAL TO THE TOTAL SENT AND REMAINING
    if (Number(amount) !== outputTotal) {
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
    if (
      !verifySignature({ publicKey: localPublicKey, data: output, signature })
    ) {
      console.error(`Invalid signature from ${localPublicKey}`);

      return false;
    }

    return true;
  }

  update({
    publicKey,
    recipient,
    amount,
    balance,
    address,
    localWallet,
  }: ICreateOutputParams): void {
    // CONVERT THE NUMBERS IN STRING FORM TO NUMBERS
    amount = Number(amount);
    this.output[address] = Number(this.output[address]);
    this.output[recipient] = Number(this.output[recipient]);

    if (amount > this.output[address]) {
      throw new Error("Insufficient balance");
    }

    // MAKE SURE TO CONVERT THE NUMBERS BACK TO THEIR STRING FORM
    if (!this.output[recipient]) {
      this.output[recipient] = amount.toFixed(8);
    } else {
      this.output[recipient] = (this.output[recipient] + amount).toFixed(8);
    }

    this.output[address] = (this.output[address] - amount).toFixed(8);

    this.input = this.createInput({
      publicKey,
      address,
      balance,
      localWallet,
      output: this.output,
    });
  }

  static rewardTransaction({
    minerPublicKey,
  }: {
    minerPublicKey: string;
  }): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
