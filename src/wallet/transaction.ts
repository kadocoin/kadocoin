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
  IUpdate,
  TTransactionChild,
} from '../types';
import costOfMessage from '../util/costOfMessage';
import { filterAddress } from '../util/get-only-address';
import { totalFeeReward } from '../util/transaction-metrics';

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
    const msg_fee = Number(costOfMessage({ message }));
    const totalAmount = amount + msg_fee; //+ send_fee;
    const currentSenderBalance = Number(this.output[address]);
    const currentSendingAmount = amount;

    if (totalAmount > currentSenderBalance) throw new Error('Insufficient balance');

    if (message || sendFee) {
      if (!this.output[recipient]) {
        console.log('d');
        this.output[recipient] = amount.toFixed(8);
      }

      if (this.output[recipient]) {
        console.log('e');
        const recipientOldAmount = Number(this.output[recipient]);

        if (currentSendingAmount > recipientOldAmount) {
          this.output[address] = (
            currentSenderBalance +
            recipientOldAmount -
            currentSendingAmount
          ).toFixed(8);
          this.output[recipient] = currentSendingAmount.toFixed(8);
        }

        if (currentSendingAmount < recipientOldAmount) {
          const refund = recipientOldAmount - currentSendingAmount;
          this.output[address] = (currentSenderBalance + refund).toFixed(8);
          this.output[recipient] = currentSendingAmount.toFixed(8);
        }
      }

      if (message) {
        console.log('f', message);
        if (this.output[`msg-fee-${recipient}`]) {
          const value = Number(this.output[`msg-fee-${recipient}`]);

          if (msg_fee < value) {
            const refund = value - msg_fee;
            this.output[address] = (Number(this.output[address]) + refund).toFixed(8);
          }

          if (msg_fee > value) {
            const remove = msg_fee - value;
            this.output[address] = (Number(this.output[address]) - remove).toFixed(8);
          }
        }

        if (!this.output[`msg-fee-${recipient}`]) {
          this.output[address] = (Number(this.output[address]) - msg_fee).toFixed(8);
        }

        // SET NEW MESSAGE FEE
        this.output[`msg-fee-${recipient}`] = msg_fee.toFixed(8);
      }

      if (sendFee) {
        console.log('g', 'sendFee');

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
        }

        if (!this.output[`send-fee-${recipient}`]) {
          this.output[address] = (Number(this.output[address]) - send_fee).toFixed(8);
        }

        // SET NEW SEND FEE
        this.output[`send-fee-${recipient}`] = send_fee.toFixed(8);
      }

      // NO MESSAGE - REMOVE PROPERTY AND REFUND
      if (this.output[`msg-fee-${recipient}`]) {
        console.log('b');

        const value = Number(this.output[`msg-fee-${recipient}`]);
        const refund = value - msg_fee;
        console.log({ value, msg_fee });
        delete this.output[`msg-fee-${recipient}`];
        this.output[address] = (Number(this.output[address]) + refund).toFixed(8);
      }

      // NO SEND FEE - REMOVE PROPERTY AND REFUND
      if (this.output[`send-fee-${recipient}`]) {
        console.log('c');
        const value = Number(this.output[`send-fee-${recipient}`]);
        const refund = value - send_fee;

        delete this.output[`send-fee-${recipient}`];
        this.output[address] = (Number(this.output[address]) + refund).toFixed(8);
      }
    } else {
      if (!this.output[recipient]) {
        console.log('d2');
        this.output[recipient] = amount.toFixed(8);
      }

      if (this.output[recipient]) {
        console.log('e2');
        const recipientOldAmount = Number(this.output[recipient]);

        if (currentSendingAmount > recipientOldAmount) {
          this.output[address] = (
            currentSenderBalance +
            recipientOldAmount -
            currentSendingAmount
          ).toFixed(8);
          this.output[recipient] = currentSendingAmount.toFixed(8);
        }

        if (currentSendingAmount < recipientOldAmount) {
          const refund = recipientOldAmount - currentSendingAmount;
          this.output[address] = (currentSenderBalance + refund).toFixed(8);
          this.output[recipient] = currentSendingAmount.toFixed(8);
        }
      }
    }

    this.input = this.createInput({
      publicKey,
      address,
      balance,
      localWallet,
      output: this.output,
      message,
    });
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
  }: {
    minerPublicKey: string;
    message: string;
  }): Transaction {
    REWARD_INPUT.recipient = minerPublicKey;
    REWARD_INPUT.message = message;

    return new Transaction({
      input: REWARD_INPUT,
      output: { [minerPublicKey]: (50).toFixed(8) },
    });
  }

  // END CLASS
}

export default Transaction;
