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
      console.log({ data });
      // switch (data.type) {
      //   case MSG_TYPES.BLOCKCHAIN:
      //     this.blockchain.addBlockFromPeerToLocal(
      //       data.metadata.message,
      //       true,
      //       this.blockchain.chain,
      //       () => {
      //         // TODO: CLEAR?
      //         this.transactionPool.clearBlockchainTransactions({
      //           chain: data.metadata.message,
      //         });
      //       }
      //     );

      //     // TODO: SEND TO OTHER NODES
      //     return;
      //   case MSG_TYPES.TRANSACTION:
      //     this.transactionPool.setTransaction(data.metadata.message);
      //     return;
      //   default:
      //     return;
      // }
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
}

export default P2P;
