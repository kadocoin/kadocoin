import { RedisClient } from 'redis';
import Blockchain from '../blockchain';
import { redisClientPub, redisClientSub } from '../config/redis';
import { TDataChild } from '../types';
import Transaction from '../wallet/transaction';
import TransactionPool from '../wallet/transaction-pool';

const CHANNELS = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class PubSub {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  publisher: RedisClient;
  subscriber: RedisClient;

  constructor({
    blockchain,
    transactionPool,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
  }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.publisher = redisClientPub;
    this.subscriber = redisClientSub;

    this.subscribeToChannel();

    this.subscriber.on('message', (channel: string, message: string) =>
      this.handleMessage(channel, message)
    );
  }

  handleMessage(channel: string, message: string): void {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage,
          });
        });
        return;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        return;
      default:
        return;
    }
  }

  subscribeToChannel(): void {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel);
    });
  }

  // UNSUBSCRIBE SO YOU DON'T SEND THE SAME MESSAGE TO YOURSELF. SUBSCRIBE AFTER SENDING THE MESSAGE
  publish({ channel, message }: { channel: string; message: string }): void {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }

  broadcastChain(): void {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastTransaction(transaction: Transaction | TDataChild): void {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }

  // END CLASS
}

export default PubSub;
