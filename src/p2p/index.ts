/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import plexus from '@nephys/plexus';
import publicIp from 'public-ip';
import { incomingObj } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';

const PORT = 5346;
const MSG_TYPES = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class P2P {
  node: plexus;
  blockchain: Blockchain;
  transactionPool: TransactionPool;

  constructor({
    blockchain,
    transactionPool,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
  }) {
    this.node = new plexus.Node({ host: '127.0.0.1', port: PORT });
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
  }

  handleMessage(type: string, message: string): void {
    console.log(`Message received. Channel: ${type}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch (type) {
      case MSG_TYPES.BLOCKCHAIN:
        this.blockchain.addBlockFromPeerToLocal(parsedMessage, true, this.blockchain.chain, () => {
          // TODO: CLEAR?
          this.transactionPool.clearBlockchainTransactions({
            chain: parsedMessage,
          });
        });
        return;
      case MSG_TYPES.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        return;
      default:
        return;
    }
  }

  async broadcastTransaction(transaction: Transaction): Promise<void> {
    const peers = [{ host: '127.0.0.1', port: 5347 }];
    const ip = await this.getPublicIP();

    // FOR EACH PEER
    peers.forEach(peer => {
      // CONNECT THIS PEER TO TO THE REMOTE PEER
      this.node.connect({ host: peer.host, port: peer.port });

      this.node.on('connected', () => {
        const message = {
          type: 'TRANSACTION',
          metadata: {
            message: transaction,
            sender: `${ip}:${PORT}`,
            timestamp: new Date().getTime(),
          },
        };

        this.node.broadcast({ data: message });
      });
    });

    // END BROADCAST
  }

  async broadcastNewlyMinedBlock(block: incomingObj): Promise<void> {
    const peers = [{ host: '127.0.0.1', port: 5347 }];
    const ip = await this.getPublicIP();

    // FOR EACH PEER
    peers.forEach(peer => {
      // CONNECT THIS PEER TO TO THE REMOTE PEER
      this.node.connect({ host: peer.host, port: peer.port });

      this.node.on('connected', () => {
        const message = {
          type: 'BLOCK',
          metadata: {
            message: block,
            sender: `${ip}:${PORT}`,
            timestamp: new Date().getTime(),
          },
        };

        this.node.broadcast({ data: message });
      });
    });

    // END BROADCAST
  }

  getPublicIP = async (): Promise<string> => await publicIp.v4();
}

export default P2P;
