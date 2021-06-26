/* eslint-disable @typescript-eslint/no-explicit-any */
import { v1 as uuidv1 } from "uuid";
import Wallet from ".";
import { REWARD_INPUT, MINING_REWARD } from "../config/constants";
import { verifySignature } from "../util/index";
import { isValidChecksumAddress } from "../util/pubKeyToAddress";

type TOutputMap = { recipient?: string; address?: string };

interface ITransactionProps {
  recipient?: string;
  amount?: number;
  output?: any;
  input?: any;
  balance?: number | string;
  localWallet?: Wallet;
  publicKey?: string;
  address?: string;
}
interface ICreateOutputMapProps {
  senderWallet?: Wallet;
  recipient: string;
  amount: number;
  signature?: any;
  balance?: number | string;
  localWallet?: Wallet;
  output?: any;
  publicKey?: string;
  address?: string;
}
interface ICreateInputProps {
  senderWallet?: Wallet;
  output?: any;
  signature?: any;
  balance?: number | string;
  localPublicKey?: string;
  localWallet?: Wallet;
  publicKey?: string;
  address?: string;
  amount?: number;
  timestamp?: number;
}

type TRewardTransactionParam = {
  minerPublicKey: string;
};

class Transaction {
  id: string;
  output: TOutputMap;
  input: ICreateInputProps;

  constructor({
    publicKey,
    address,
    recipient,
    amount,
    output,
    input,
    balance,
    localWallet,
  }: ITransactionProps) {
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
  }: ICreateOutputMapProps): TOutputMap {
    const output = {};

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
  }: ICreateInputProps): ICreateInputProps {
    return {
      timestamp: Date.now(),
      amount: balance as number,
      address: address,
      publicKey: publicKey,
      localPublicKey: localWallet.publicKey,
      signature: localWallet.sign(output),
    };
  }

  static validTransaction(transaction: ITransactionProps): boolean {
    const {
      input: { address, publicKey, amount, signature, localPublicKey },
      output,
    } = transaction;

    const outputTotal = Object.values(output).reduce(
      (total: any, outputAmount: any) => Number(total) + Number(outputAmount)
    );

    if (Number(amount) !== outputTotal) {
      console.error(`Invalid transaction from ${address} ${publicKey}`);

      return false;
    }

    if (!isValidChecksumAddress(address)) {
      console.error(
        "Invalid Kadocoin address. Please check the address again."
      );

      return false;
    }

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
  }: ICreateOutputMapProps): void {
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
  }: TRewardTransactionParam): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
