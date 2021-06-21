import { v1 as uuidv1 } from 'uuid';
import { REWARD_INPUT, MINING_REWARD } from '../config/constants';
import { IUserModel } from '../types';
import { verifySignature } from '../util/index';

type TInput = {
  timestamp: number;
  amount: number;
  address: string;
  signature: string;
};
interface ITransactionProps {
  senderWallet?: {
    publicKey: string;
    balance: number;
    address?: string;
    sign: (outputMap: any) => void;
  };
  recipient?: string;
  amount?: number;
  outputMap?: any;
  input?: any;
  userDoc?: any;
  balance?: any;
  localWallet?: any;
}
interface ICreateOutputMapProps {
  senderWallet?: any;
  recipient: any;
  amount: any;
  signature?: any;
  userDoc?: any;
  balance?: any;
  localWallet?: any;
  outputMap?: any;
}
interface ICreateInputProps {
  senderWallet?: any;
  outputMap?: any;
  signature?: any;
  userDoc?: any;
  balance?: any;
  localAddress?: any;
  localWallet: any;
}
interface IOutputMap {
  [recipient: string]: number;
}

type TRewardTransactionParam = {
  minerPublicKey: string;
};

class Transaction {
  [x: string]: any;
  constructor({ userDoc, recipient, amount, outputMap, input, balance, localWallet }: ITransactionProps) {
    this.id = uuidv1();
    this.outputMap = outputMap || this.createOutputMap({ userDoc, recipient, amount, balance });
    this.input = input || this.createInput({ userDoc, balance, localWallet, outputMap: this.outputMap });
  }

  createOutputMap({ userDoc, recipient, amount, balance }: ICreateOutputMapProps) {
    const outputMap: IOutputMap = {};

    outputMap[recipient] = amount;
    outputMap[userDoc.publicKey] = balance - amount;

    return outputMap;
  }

  createInput({ userDoc, balance, localWallet, outputMap }: ICreateInputProps) {
    return {
      timestamp: Date.now(),
      amount: balance,
      address: userDoc.publicKey,
      localAddress: localWallet.publicKey,
      signature: localWallet.sign(outputMap),
    };
  }

  static validTransaction(transaction: ITransactionProps, userDoc?: IUserModel) {
    const {
      input: { address, amount, signature, localAddress },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce((total: any, outputAmount: any) => total + outputAmount);

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);

      return false;
    }

    if (!verifySignature({ publicKey: localAddress, data: outputMap, signature })) {
      console.error(`Invalid signature from ${localAddress || address}`);

      return false;
    }

    return true;
  }

  update({ userDoc, recipient, amount, balance, localWallet }: ICreateOutputMapProps) {
    if (amount > this.outputMap[userDoc.publicKey]) {
      throw new Error('Amount exceeds the balance');
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[userDoc.publicKey] = this.outputMap[userDoc.publicKey] - amount;

    this.input = this.createInput({ userDoc, balance, localWallet, outputMap: this.outputMap });
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
