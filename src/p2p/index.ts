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
import fs from 'fs';
import { IHost, incomingObj } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import ConsoleLog from '../util/console-log';
import request from 'request';
import { ROOT_NODE_ADDRESS } from '../config/secret';
import appendPeerToFile from '../util/appendPeerToFile';
import getPeersFromFile from '../util/getPeersFromFile';
import { peersStorageFile } from '../config/constants';

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
    // this.addRemotePeersToLocal();
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

  async getPeers(): Promise<string> {
    if (fs.existsSync(peersStorageFile)) {
      return getPeersFromFile(peersStorageFile);
    }

    return 'This node has no peers';
  }

  addRemotePeersToLocal(): void {
    request({ url: `${ROOT_NODE_ADDRESS}/get-peers` }, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const incomingPeers = JSON.parse(JSON.parse(body).message);

        /** GET LOCAL PEERS */
        const localPeers = JSON.parse(await this.getPeers());

        const peersNotPresentInLocal = this.getPeersNotInLocal(incomingPeers, localPeers);

        ConsoleLog(`Found ${peersNotPresentInLocal.length}(s) incoming peers`);

        if (peersNotPresentInLocal.length) {
          ConsoleLog('Adding remote peer to file');
          appendPeerToFile(peersNotPresentInLocal, peersStorageFile);
          ConsoleLog(`Added ${peersNotPresentInLocal.length} remote peer(s) to file`);
        }
      } else {
        console.log(`${ROOT_NODE_ADDRESS}/get-peers`, error);
      }
    });
  }

  private getPeersNotInLocal(incomingPeers: Array<IHost>, localPeers: Array<IHost>) {
    const peersNotPresentInLocal = [];
    const localHosts = new Map();

    for (let j = 0; j < localPeers.length; j++) {
      localHosts.set(localPeers[j].host, localPeers[j].port);
    }

    for (let i = 0; i < incomingPeers.length; i++) {
      const incomingPeer = incomingPeers[i];

      if (!localHosts.has(incomingPeer.host)) peersNotPresentInLocal.push(incomingPeer);
    }

    return peersNotPresentInLocal;
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
