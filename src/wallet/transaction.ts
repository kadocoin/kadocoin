/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
// Copyright (c) Adamu Muhammad Dankore
import { v1 as uuidv1 } from 'uuid';
import { NOT_ENOUGH, REWARD_INPUT } from '../config/constants';
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
import Mining_Reward from '../util/supply_reward';
import costOfMessage from '../util/text-2-coins';
import { filterAddress } from '../util/address-filter';

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
      message,
    };
  }

  createOutputMap({ address, recipient, amount, balance, message, sendFee }: ICOutput): ICOutput_R {
    const output: ICOutput_R = {} as ICOutput_R;
    const msg_fee = message ? costOfMessage({ message }) : 0;
    const send_fee = sendFee ? Number(sendFee) : 0;
    const totalAmount = amount + msg_fee + send_fee;

    output[address] = (Number(balance) - totalAmount).toFixed(8);
    output[recipient] = amount.toFixed(8);

    if (message) output[`msg-fee-${recipient}`] = msg_fee.toFixed(8);
    if (sendFee) output[`send-fee-${recipient}`] = send_fee.toFixed(8);

    return output;
  }

  static validTransaction(transaction: TTransactionChild): boolean {
    const {
      input: { address, publicKey, amount, signature, localPublicKey },
      output,
    } = transaction;

    let outputTotal = Object.values(output).reduce(
      (total, outputAmount) => Number(total) + Number(outputAmount),
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

  update({
    publicKey,
    recipient,
    amount,
    balance,
    address,
    localWallet,
    message,
    sendFee,
  }: IUpdate): void {
    const send_fee = sendFee ? Number(sendFee) : 0;
    const msg_fee = message ? costOfMessage({ message }) : 0;
    const totalAmount = amount + msg_fee + send_fee;

    if (totalAmount > Number(this.output[address])) throw new Error(NOT_ENOUGH);

    if (!this.output[recipient]) {
      this.output[recipient] = amount.toFixed(8);
    } else {
      this.output[recipient] = (Number(this.output[recipient]) + amount).toFixed(8);
    }

    if (message || sendFee) {
      // MESSAGE LOGIC
      if (message) {
        const msg_fee = costOfMessage({ message });
        if (this.output[`msg-fee-${recipient}`]) {
          const value = this.output[`msg-fee-${recipient}`];

          if (msg_fee < value) {
            const refund = Number(value) - msg_fee;
            this.output[address] = (Number(this.output[address]) + refund).toFixed(8);
          }

          if (msg_fee > value) {
            const remove = msg_fee - Number(value);
            this.output[address] = (Number(this.output[address]) - remove).toFixed(8);
          }
        } else {
          this.output[address] = (Number(this.output[address]) - msg_fee).toFixed(8);
        }

        this.output[`msg-fee-${recipient}`] = msg_fee.toFixed(8);
      }

      // SEND FEE LOGIC
      if (sendFee) {
        const send_fee = Number(sendFee);

        if (this.output[`send-fee-${recipient}`]) {
          const value = Number(this.output[`send-fee-${recipient}`]);

          if (send_fee < value) {
            const refund = value - send_fee;
            this.output[address] = (Number(this.output[address]) + refund).toFixed(8);
          }

          if (send_fee > value) {
            const remove = send_fee - value;
            this.output[address] = (Number(this.output[address]) - remove).toFixed(8);
          }
        } else {
          this.output[address] = (Number(this.output[address]) - send_fee).toFixed(8);
        }

        this.output[`send-fee-${recipient}`] = send_fee.toFixed(8);
      }
      // COMMON
      this.output[address] = (Number(this.output[address]) - amount).toFixed(8);
    } else {
      this.output[address] = (Number(this.output[address]) - amount).toFixed(8);
    }

    this.input = this.createInput({
      publicKey,
      address,
      balance,
      localWallet,
      output: this.output,
      ...(message ? { message } : { message: this.input['message'] }),
    });
  }

  static rewardTransaction({
    minerPublicKey,
    message,
    chainLength,
    msgReward,
    feeReward,
  }: {
    minerPublicKey: string;
    message?: string;
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

    REWARD_INPUT.recipient = minerPublicKey;
    message && (REWARD_INPUT.message = message); // OPTIONAL
    REWARD_INPUT.amount = totalMiningReward;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: totalMiningReward },
    });
  }

  // END CLASS
}

export default Transaction;
