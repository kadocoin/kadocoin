import uuid from 'uuid';
import { REWARD_INPUT, MINING_REWARD } from '../config/constants';
import { verifySignature } from '../util/index';

type TInput = {
  timestamp: Date;
  amount: number;
  address: string;
  signature: string;
};
interface ITransactionProps {
  senderWallet?: {
    publicKey: string;
    balance: number;
    address: string;
    sign: (outputMap: any) => void;
  };
  recipient?: string;
  amount?: number;
  outputMap?: any;
  input?: any;
}
interface ICreateOutputMapProps {
  senderWallet: any;
  recipient: any;
  amount: any;
}
interface ICreateInputProps {
  senderWallet: any;
  outputMap?: any;
}
interface IOutputMap {
  [recipient: string]: number;
}

class Transaction {
  id: string;
  outputMap: any;
  input: any;

  constructor({ senderWallet, recipient, amount, outputMap, input }: ITransactionProps) {
    this.id = uuid.v1();
    this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
    this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
  }

  createOutputMap({ senderWallet, recipient, amount }: ICreateOutputMapProps) {
    const outputMap: IOutputMap = {};

    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

    return outputMap;
  }

  createInput({ senderWallet, outputMap }: ICreateInputProps) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap),
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

  update({ senderWallet, recipient, amount }: ICreateOutputMapProps) {
    if (amount > this.outputMap[senderWallet.publicKey]) {
      throw new Error('Amount exceeds the balance');
    }

    if (!this.outputMap[recipient]) {
      this.outputMap[recipient] = amount;
    } else {
      this.outputMap[recipient] = this.outputMap[recipient] + amount;
    }

    this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;

    this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
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
