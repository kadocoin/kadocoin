import { redisClientPub, redisClientSub } from '../config/redis'

const CHANNELS = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class PubSub {
  [x: string]: any;
  constructor({ blockchain, transactionPool }: { blockchain: any, transactionPool: any }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.publisher = redisClientPub;
    this.subscriber = redisClientSub;

    this.subscribeToChannel();

    this.subscriber.on('message', (channel: string, message: string) => this.handleMessage(channel, message));
  }

  handleMessage(channel: string, message: string) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({ chain: parsedMessage });
        });
        return;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        return;
      default:
        return;
    }
  }

  subscribeToChannel() {
    Object.values(CHANNELS).forEach(channel => {
      this.subscriber.subscribe(channel);
    });
  }

  // UNSUBSCRIBE SO YOU DON'T SEND THE SAME MESSAGE TO YOURSELF. SUBSCRIBE AFTER SENDING THE MESSAGE
  publish({ channel, message }:{channel: string, message: string}) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }

  broadcastChain() {
    this.publish({ channel: CHANNELS.BLOCKCHAIN, message: JSON.stringify(this.blockchain.chain) });
  }

  broadcastTransaction(transaction: any) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }

  // END CLASS
}

module.exports = PubSub;
