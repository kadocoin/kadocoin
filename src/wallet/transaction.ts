/* eslint-disable @typescript-eslint/no-explicit-any */
import { v1 as uuidv1 } from "uuid";
import Wallet from ".";
import { REWARD_INPUT, MINING_REWARD } from "../config/constants";
import { verifySignature } from "../util/index";

type TOutputMap = { recipient?: string; address?: string };

interface ITransactionProps {
  recipient?: string;
  amount?: number;
  outputMap?: any;
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
  outputMap?: any;
  publicKey?: string;
  address?: string;
}
interface ICreateInputProps {
  senderWallet?: Wallet;
  outputMap?: any;
  signature?: any;
  balance?: number | string;
  localAddress?: string;
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
  outputMap: TOutputMap;
  input: ICreateInputProps;

  constructor({
    publicKey,
    address,
    recipient,
    amount,
    outputMap,
    input,
    balance,
    localWallet,
  }: ITransactionProps) {
    this.id = uuidv1();
    this.outputMap =
      outputMap ||
      this.createOutputMap({ address, recipient, amount, balance });
    this.input =
      input ||
      this.createInput({
        publicKey,
        address,
        balance,
        localWallet,
        outputMap: this.outputMap,
      });
  }

  createOutputMap({
    address,
    recipient,
    amount,
    balance,
  }: ICreateOutputMapProps): TOutputMap {
    const outputMap = {};

    outputMap[recipient] = amount.toFixed(8);
    outputMap[address] = ((balance as number) - amount).toFixed(8);

    return outputMap;
  }

  createInput({
    publicKey,
    balance,
    address,
    localWallet,
    outputMap,
  }: ICreateInputProps): ICreateInputProps {
    return {
      timestamp: Date.now(),
      amount: balance as number,
      address: address,
      publicKey: publicKey,
      localAddress: localWallet.publicKey,
      signature: localWallet.sign(outputMap),
    };
  }

  static validTransaction(transaction: ITransactionProps): boolean {
    const {
      input: { address, publicKey, amount, signature, localAddress },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce(
      (total: any, outputAmount: any) => Number(total) + Number(outputAmount)
    );

    if (Number(amount) !== outputTotal) {
      console.error(`Invalid transaction from ${address} ${publicKey}`);

      return false;
    }

    if (
      !verifySignature({ publicKey: localAddress, data: outputMap, signature })
    ) {
      console.error(`Invalid signature from ${localAddress}`);

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
    this.outputMap[address] = Number(this.outputMap[address]);
    this.outputMap[recipient] = Number(this.outputMap[recipient]);

    if (amount > this.outputMap[address]) {
      throw new Error("Insufficient balance");
    }

    // MAKE SURE TO CONVERT THE NUMBERS BACK TO THEIR STRING FORM
    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount.toFixed(8);
    } else {
      this.outputMap[recipient] = (this.outputMap[recipient] + amount).toFixed(
        8
      );
    }

    this.outputMap[address] = (this.outputMap[address] - amount).toFixed(8);

    this.input = this.createInput({
      publicKey,
      address,
      balance,
      localWallet,
      outputMap: this.outputMap,
    });
  }

  static rewardTransaction({
    minerPublicKey,
  }: TRewardTransactionParam): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;

    return new Transaction({
      input: REWARD_INPUT,
      outputMap: { [minerPublicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
