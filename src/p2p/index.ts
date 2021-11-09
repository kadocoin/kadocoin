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
import ConsoleLog from '../util/console-log';

let PORT = 5346;
if (process.env.GENERATE_PEER_PORT === 'true') PORT = 5347;

console.log({ PORT });

const MSG_TYPES = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class P2P {
  node: any;
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
    this.handleMessage();
  }

  handleMessage(): void {
    this.node.on('broadcast', (data: any) => {
      switch (data.type) {
        case MSG_TYPES.BLOCKCHAIN:
          console.log('BLOCKCHAIN');
          this.blockchain.addBlockFromPeerToLocal(data.message, true, this.blockchain.chain, () => {
            // TODO: CLEAR?
            this.transactionPool.clearBlockchainTransactions({
              chain: data.message,
            });
          });

          // TODO: SEND TO OTHER NODES
          return;
        case MSG_TYPES.TRANSACTION:
          console.log('TRANSACTION');

          /**
           * FORWARD TRANSACTION TO PEERS
           */

          // CHECK FOR EXISTING TRANSACTION
          const existingTransaction = this.transactionPool.existingTransactionPool({
            inputAddress: data.message.input.address,
          });

          this.transactionPool.setTransaction(data.message);

          if (existingTransaction) {
            if (existingTransaction.input.timestamp == data.message.input.timestamp) {
              ConsoleLog("I already have this transaction. I'M NOT FORWARDING IT.");
              return;
            }

            // FORWARD THE MESSAGE TO OTHER PEERS
            ConsoleLog('FORWARDING TRANSACTION TO MY PEERS.');
            this.forwardTransactionToPeers(data.message, data.sender);
          }

          console.log({
            existingTransaction: existingTransaction,
            incomingTransaction: data.message,
          });
          return;
        default:
          return;
      }
    });
  }

  async broadcastTransaction(transaction: Transaction): Promise<void> {
    const peers = [{ host: '127.0.0.1', port: 5347 }];
    const aboutThisNode = await this.nodeInfo();

    // FOR EACH PEER
    peers.forEach(peer => {
      // CONNECT THIS PEER TO THE REMOTE PEER
      this.node.connect({ host: peer.host, port: peer.port });

      // DO THIS ONCE CONNECTED
      this.node.on('connected', () => {
        const message = {
          type: 'TRANSACTION',
          message: transaction,
          sender: {
            about: aboutThisNode,
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

  async nodeInfo(): Promise<{ host: string; port: number; id: string }> {
    const ip = await this.getPublicIP();

    return {
      host: ip,
      port: this.node.self.port,
      id: this.node.self.id,
    };
  }

  async forwardTransactionToPeers(
    transaction: Transaction,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    const peers = [{ host: '127.0.0.1', port: 5348 }];
    console.log(transaction, sender);

    // FOR EACH PEER
    peers.forEach(peer => {
      if (sender.host != peer.host) {
        // CONNECT THIS PEER TO THE REMOTE PEER
        this.node.connect({ host: peer.host, port: peer.port });
        // DO THIS ONCE CONNECTED
        this.node.on('connected', () => {
          const message = {
            type: 'TRANSACTION',
            message: transaction,
            sender,
          };

          this.node.broadcast({ data: message });
        });
      }
    });
  }
}

export default P2P;
