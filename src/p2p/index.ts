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
import fs, { unlinkSync } from 'fs';
import { IHost, incomingObj } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import ConsoleLog from '../util/console-log';
import request from 'request';
import { ROOT_NODE_ADDRESS } from '../config/secret';
import appendPeerToFile from '../util/appendPeerToFile';
import getPeersFromFile from '../util/getPeersFromFile';
import { blockchainStorageFile, hardCodedPeers, peersStorageFile } from '../config/constants';
import getLastLine from '../util/getLastLine';
import appendToFile from '../util/appendPeerToFile';
import Mining_Reward from '../util/supply_reward';
import EventEmitter from 'events';

const PORT = 5346;

const MSG_TYPES = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class P2P {
  node: any;
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  rpc: any;
  broadcast_emitter: EventEmitter;
  count: number;
  randomPeerIndexTracker: number[];
  arrayPeersIndex: number[];
  hardCodedPeers: { host: string; port: number }[];
  connected: boolean;
  kadocoin_events: EventEmitter;

  constructor({
    blockchain,
    transactionPool,
    kadocoin_events,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    kadocoin_events: EventEmitter;
  }) {
    this.node = new plexus.Node({ host: '127.0.0.1', port: PORT });
    this.kadocoin_events = kadocoin_events;
    this.blockchain = blockchain;
    this.node.store({ key: 'blocks', value: this.blockchain });
    this.transactionPool = transactionPool;
    this.connected = false;
    this.randomPeerIndexTracker = [];
    this.arrayPeersIndex = Array.from(Array(hardCodedPeers.length).keys());
    this.hardCodedPeers = hardCodedPeers;
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
    return '';
  }

  async syncNodeWithHistoricalBlockchain(): Promise<void> {
    // LOOP THRU HARDCODED PEERS
    await this.loopAndRunPeers(this.hardCodedPeers);

    // THE BELOW CODE WILL RUN IF NONE OF THE HARDCODED PEERS IS ALIVE
    if (!this.connected) {
      console.log('');
      console.log('RETRIEVING PEERS FROM LOCAL FILE');
      const peers = await this.getPeers();
      const peersParsed = JSON.parse(peers);

      if (peersParsed) {
        await this.loopAndRunPeers(peersParsed);
      }
    }
  }

  private async loopAndRunPeers(peers: Array<IHost>): Promise<void> {
    for (let i = 0; i < peers.length; i++) {
      ConsoleLog('=============================');
      console.log({ connected: this.connected });
      if (!this.connected) {
        //  NODE CONNECT ATTEMPT
        console.log('');
        console.log('');
        console.log('=============================');
        console.log('');
        console.log('');
        console.log(`Attempting to connect to ${JSON.stringify(peers[i], null, 2)}`);

        console.log('');
        console.log('');
        console.log('=============================');
        console.log('');
        console.log('');

        await this.getBlockchainDataFromRandomPeer(peers[i]);

        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        ConsoleLog('Found a peer that responded');
        ConsoleLog('Exiting');
        break;
      }
    }
  }

  async getBlockchainDataFromRandomPeer(randomPeer: IHost): Promise<void> {
    this.node.connect({ host: randomPeer.host, port: randomPeer.port });

    // REMOVE ALL `CONNECTED` EVENTS
    this.node.removeAllListeners('connected');

    // GET BLOCKCHAIN DATA FROM OTHER PEERS
    this.node.on('connected', () => this.onConnected(randomPeer));
  }

  private onConnectedGetPeers(randomPeer: IHost): void {
    request({ url: `http://${randomPeer.host}:2000/get-peers` }, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let incomingPeers = JSON.parse(body).message;

        if (incomingPeers) {
          try {
            /** GET LOCAL PEERS */
            incomingPeers = JSON.parse(incomingPeers);

            const localPeers = JSON.parse(await this.getPeers());

            const peersNotPresentInLocal = this.getPeersNotInLocal(incomingPeers, localPeers);

            ConsoleLog(`Found ${peersNotPresentInLocal.length}(s) incoming peers`);

            if (peersNotPresentInLocal.length) {
              ConsoleLog('Adding remote peer to file');
              appendPeerToFile(peersNotPresentInLocal, peersStorageFile);
              ConsoleLog(`Added ${peersNotPresentInLocal.length} remote peer(s) to file`);
            }
          } catch (error) {
            console.log('Error adding peers to local file.', error);
          }
        }
        // this.kadocoin_events.emit('addRemotePeersToLocal_complete');
      } else {
        console.log(`${ROOT_NODE_ADDRESS}/get-peers`, error);
      }
    });
  }

  private onConnected(randomPeer: IHost): void {
    this.connected = true;
    const lookup = this.node.find({ key: 'blocks' });

    ConsoleLog('Found an alive peer. Looking up its data');

    //  THE ITEM EXISTS ON THE NETWORK
    lookup.on('found', async (result: any) => {
      const rootChain = result.value.chain;

      // GET THIS LIVE REMOTE PEER PEERS
      this.onConnectedGetPeers(randomPeer);

      /** SAVING TO FILE STARTS */
      // FILE EXISTS
      if (fs.existsSync(blockchainStorageFile)) {
        const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
        const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
        console.log({ blockchainHeightFromPeer, blockchainHeightFromFile });

        /** THIS PEER IS AHEAD */
        if (blockchainHeightFromPeer < blockchainHeightFromFile) {
          try {
            ConsoleLog('THIS PEER IS AHEAD');
            // DELETE FILE
            unlinkSync(blockchainStorageFile);
            ConsoleLog('FILE DELETED');
            // REPLACE WITH BLOCKS FROM PEER
            appendToFile(rootChain, blockchainStorageFile);
          } catch {
            ConsoleLog('ERROR DELETING FILE');
          }
        }

        /** THIS PEER NEEDS TO CATCH UP */
        if (blockchainHeightFromPeer > blockchainHeightFromFile) {
          /** ADD THE MISSING BLOCKS TO LOCAL FILE */
          ConsoleLog('ADD THE MISSING BLOCKS TO LOCAL FILE');
          // WRITE TO FILE: ADD THE DIFFERENCE STARTING FROM THE LAST BLOCK IN THE FILE
          const diffBlockchain = rootChain.slice(blockchainHeightFromFile);

          // NOW WRITE LINE BY LINE
          appendToFile(diffBlockchain, blockchainStorageFile);
        }
      } else {
        ConsoleLog('FILE DOES NOT EXISTS');
        appendToFile(rootChain, blockchainStorageFile);
      }
      /** END SAVING TO FILE */

      ConsoleLog('REPLACING YOUR LOCAL BLOCKCHAIN WITH THE CONSENSUS BLOCKCHAIN');
      ConsoleLog('WORKING ON IT');

      // TODO: SYNC FROM DISK ?
      this.blockchain.replaceChain(rootChain);

      // UPDATE MINING_REWARD
      const { MINING_REWARD, SUPPLY } = new Mining_Reward().calc({
        chainLength: this.blockchain.chain.length,
      });
      console.log({ MINING_REWARD, SUPPLY });
    });

    //  THE ITEM DOESN'T EXIST ANYWHERE ON THE NETWORK
    lookup.on('timeout', () => {
      ConsoleLog('Find request timed out');
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
