import { v1 as uuidv1 } from "uuid";
import { REWARD_INPUT, MINING_REWARD } from "../config/constants";
import { verifySignature } from "../util/index";

type TInput = {
  timestamp: number;
  amount: number;
  address: string;
  signature: string;
};
interface ITransactionProps {
  recipient?: string;
  amount?: number;
  outputMap?: any;
  input?: any;
  balance?: any;
  localWallet?: any;
  publicKey?: string;
}
interface ICreateOutputMapProps {
  senderWallet?: any;
  recipient: any;
  amount: any;
  signature?: any;
  balance?: any;
  localWallet?: any;
  outputMap?: any;
  publicKey?: string;
}
interface ICreateInputProps {
  senderWallet?: any;
  outputMap?: any;
  signature?: any;
  balance?: any;
  localAddress?: any;
  localWallet: any;
  publicKey?: string;
}
interface IOutputMap {
  [recipient: string]: number;
}

type TRewardTransactionParam = {
  minerPublicKey: string;
};

class Transaction {
  [x: string]: any;
  constructor({
    publicKey,
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
      this.createOutputMap({ publicKey, recipient, amount, balance });
    this.input =
      input ||
      this.createInput({
        publicKey,
        balance,
        localWallet,
        outputMap: this.outputMap,
      });
  }

  createOutputMap({
    publicKey,
    recipient,
    amount,
    balance,
  }: ICreateOutputMapProps) {
    const outputMap: IOutputMap = {};

    outputMap[recipient] = amount;
    outputMap[publicKey!] = balance - amount;

    return outputMap;
  }

  createInput({
    publicKey,
    balance,
    localWallet,
    outputMap,
  }: ICreateInputProps) {
    return {
      timestamp: Date.now(),
      amount: balance,
      address: publicKey,
      localAddress: localWallet.publicKey,
      signature: localWallet.sign(outputMap),
    };
  }

  static validTransaction(transaction: ITransactionProps) {
    const {
      input: { address, amount, signature, localAddress },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce(
      (total: any, outputAmount: any) => total + outputAmount
    );

    if (Number(amount) !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);

      return false;
    }

    if (
      !verifySignature({ publicKey: localAddress, data: outputMap, signature })
    ) {
      console.error(`Invalid signature from ${localAddress || address}`);

      return false;
    }

    return true;
  }

  update({
    publicKey,
    recipient,
    amount,
    balance,
    localWallet,
  }: ICreateOutputMapProps) {
    if (amount > this.outputMap[publicKey!]) {
      throw new Error("Insufficient balance");
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[publicKey!] = this.outputMap[publicKey!] - amount;

    this.input = this.createInput({
      publicKey,
      balance,
      localWallet,
      outputMap: this.outputMap,
    });
  }

  static rewardTransaction({ minerPublicKey }: TRewardTransactionParam) {
    REWARD_INPUT.recipient = minerPublicKey;

    return new Transaction({
      input: REWARD_INPUT,
      outputMap: { [minerPublicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
