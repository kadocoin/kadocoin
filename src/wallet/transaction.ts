import { v1 as uuidv1 } from 'uuid';
import { REWARD_INPUT, MINING_REWARD } from '../config/constants';
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
}
interface ICreateOutputMapProps {
  senderWallet?: any;
  recipient: any;
  amount: any;
  signature?: any;
  userDoc?: any;
  balance?: any;
}
interface ICreateInputProps {
  senderWallet?: any;
  outputMap?: any;
  signature?: any;
  userDoc?: any;
  balance?: any;
}
interface IOutputMap {
  [recipient: string]: number;
}

class Transaction {
  [x: string]: any;
  constructor({ userDoc, recipient, amount, outputMap, input, balance }: ITransactionProps) {
    this.id = uuidv1();
    this.outputMap = outputMap || this.createOutputMap({ userDoc, recipient, amount, balance });
    this.input = input || this.createInput({ userDoc, balance });
  }

  createOutputMap({ userDoc, recipient, amount, balance }: ICreateOutputMapProps) {
    const outputMap: IOutputMap = {};

    outputMap[recipient] = amount;
    outputMap[userDoc.publicKey] = balance - amount;

    return outputMap;
  }

  createInput({ userDoc, balance }: ICreateInputProps) {
    return {
      timestamp: Date.now(),
      amount: balance,
      address: userDoc.publicKey,
      signature: userDoc.signature,
    };
  }

  static validTransaction(transaction: ITransactionProps) {
    const {
      input: { address, amount, signature },
      outputMap,
    } = transaction;

    const outputTotal = Object.values(outputMap).reduce((total: any, outputAmount: any) => total + outputAmount);

    if (amount !== outputTotal) {
      console.error(`Invalid transaction from ${address}`);

      return false;
    }

    if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
      console.error(`Invalid signature from ${address}`);

      return false;
    }

    return true;
  }

  update({ userDoc, recipient, amount, balance }: ICreateOutputMapProps) {
    if (amount > this.outputMap[userDoc.publicKey]) {
      throw new Error('Amount exceeds the balance');
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[userDoc.publicKey] = this.outputMap[userDoc.publicKey] - amount;

    this.input = this.createInput({ userDoc, balance });
  }

  static rewardTransaction({ minerWallet }: { minerWallet: { input: TInput; publicKey: string } }) {
    return new Transaction({
      input: REWARD_INPUT,
      outputMap: { [minerWallet.publicKey]: MINING_REWARD },
    });
  }

  // END CLASS
}

export default Transaction;
