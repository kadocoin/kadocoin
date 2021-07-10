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
  TTransactionChild,
} from '../types';
import costOfMessage from '../util/costOfMessage';
import { filterAddress } from '../util/get-only-address';
import Mining_Reward from '../util/supply_reward';

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
    sendFee,
  }: ITransaction) {
    this.id = uuidv1();
    this.output =
      output || this.createOutputMap({ address, recipient, amount, balance, message, sendFee });
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
      ...(message && { message }),
    };
  }

  createOutputMap({ address, recipient, amount, balance, message, sendFee }: ICOutput): ICOutput_R {
    const output: ICOutput_R = {} as ICOutput_R;
    const msg_fee = Number(costOfMessage({ message }));
    const send_fee = sendFee ? Number(sendFee) : 0;

    output[address] = (Number(balance) - amount - msg_fee - send_fee).toFixed(8);
    output[recipient] = amount.toFixed(8);
    message && (output[`msg-fee-${recipient}`] = msg_fee.toFixed(8));
    sendFee && (output[`send-fee-${recipient}`] = send_fee.toFixed(8));

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
    console.log(Number(amount), Number(outputTotal));
    if (Number(amount) !== Number(outputTotal)) {
      console.error(`Invalid transaction from ${address} ${publicKey}`);
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
    chainLength,
    msgReward,
    feeReward,
  }: {
    minerPublicKey: string;
    message: string;
    chainLength: number;
    msgReward: string;
    feeReward: string;
  }): Transaction {
    const { MINING_REWARD } = new Mining_Reward().calc({ chainLength });
    const totalMiningReward = (
      Number(MINING_REWARD) +
      Number(msgReward) +
      Number(feeReward)
    ).toFixed(8);

    console.log('rewardTransaction', { totalMiningReward });

    REWARD_INPUT.recipient = minerPublicKey;
    REWARD_INPUT.message = message;
    REWARD_INPUT.amount = totalMiningReward;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: totalMiningReward },
    });
  }

  // END CLASS
}

export default Transaction;
