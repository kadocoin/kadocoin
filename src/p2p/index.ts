/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import plexus from '@nephys/plexus';
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
import isEmptyObject from '../util/isEmptyObject';

const MSG_TYPES = {
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

let local_ip = '192.168.0.156'; // MAC

if (process.env.DEV_MACHINE === 'abuja') local_ip = '192.168.0.148';
if (process.env.DEV_MACHINE === 'ubuntu') local_ip = '192.168.0.155';
if (process.env.DEV_MACHINE === 'bauchi') local_ip = '192.168.0.151';

console.log({ local_ip });

class P2P {
  node: any;
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  rpc: any;
  broadcast_emitter: EventEmitter;
  hardCodedPeers: { host: string; port: number }[];
  connected: boolean;
  kadocoin_events: EventEmitter;
  count: number;
  count2: number;

  constructor({
    blockchain,
    transactionPool,
    kadocoin_events,
    node,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    kadocoin_events: EventEmitter;
    node: any;
  }) {
    this.node = node;
    this.kadocoin_events = kadocoin_events;
    this.blockchain = blockchain;
    // this.node.store({ key: 'blocks', value: this.blockchain });
    this.transactionPool = transactionPool;
    // this.node.store({ key: 'transactions', value: this.transactionPool.transactionMap });
    this.connected = false;
    this.hardCodedPeers = hardCodedPeers;
    this.count = 0;
    this.count2 = 0;
    // this.handleMessage();
    this.receiveTransactions();
  }

  handleMessage(): void {
    console.log('entered handle');
    this.node.on('broadcast', (data: any) => {
      console.log({ countHandleMessage: this.count });
      this.count++;
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
          console.log({
            incomingTransaction: data.message,
          });

          /**
           * FORWARD TRANSACTION TO PEERS
           */

          // CHECK FOR EXISTING TRANSACTION
          const existingTransaction = this.transactionPool.existingTransactionPool({
            inputAddress: data.message.input.address,
          });

          if (existingTransaction) {
            if (existingTransaction.input.timestamp == data.message.input.timestamp) {
              ConsoleLog('I already have this transaction. IGNORING IT.');
              return;
            }

            this.transactionPool.setTransaction(data.message);
          } else {
            this.transactionPool.setTransaction(data.message);
          }

          return;
        default:
          return;
      }
    });
  }

  receiveTransactions(): void {
    this.node.handle.receiveTransactions = (payload: any, done: any) => {
      // Do something with payload...
      console.log({ payload });
      done(null);
      // or: done(null, result);
    };
  }

  async sendTransactions(transaction: Transaction): Promise<void> {
    const peers = [{ host: '192.168.0.148', port: 5346 }];
    const aboutThisNode = await this.nodeInfo();

    // FOR EACH PEER
    peers.forEach(peer => {
      // CONNECT THIS PEER TO THE REMOTE PEER

      const message = {
        type: 'TRANSACTION',
        message: transaction,
        sender: {
          about: aboutThisNode,
          timestamp: new Date().getTime(),
        },
      };

      this.node
        .remote({
          host: peer.host,
          port: peer.port,
        })
        .run('handle/receiveTransactions', { data: message }, (err: any, result: any) => {
          console.log({ err, result });
        });
    });
  }

  // async broadcastTransaction(transaction: Transaction): Promise<void> {
  //   console.log({ count2: this.count2 });
  //   const aboutThisNode = await this.nodeInfo();

  //   const message = {
  //     type: 'TRANSACTION',
  //     message: transaction,
  //     sender: {
  //       about: aboutThisNode,
  //       timestamp: new Date().getTime(),
  //     },
  //   };

  //   this.node.broadcast({ data: message });
  //   this.count2++;
  // }

  async broadcastNewlyMinedBlock(block: incomingObj): Promise<void> {
    block;

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
        ConsoleLog('NONE OF THE HARDCODED AND LOCAL PEERS ARE ALIVE');
      }
    }
  }

  private async loopAndRunPeers(peers: Array<IHost>): Promise<void> {
    for (let i = 0; i < peers.length; i++) {
      ConsoleLog('=============================');
      console.log({ connected: this.connected });
      if (!this.connected) {
        if (peers[i].host !== local_ip) {
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
        }
      } else {
        ConsoleLog('Found a peer that responded');

        break;
      }
    }
  }

  private async getBlockchainDataFromRandomPeer(randomPeer: IHost): Promise<void> {
    // REMOVE ALL `CONNECTED` EVENTS
    // this.node.removeAllListeners('connected');
    // this.node.removeAllListeners('found');

    const status = this.node.connect({ host: randomPeer.host, port: randomPeer.port });

    // GET BLOCKCHAIN DATA FROM OTHER PEERS
    status.once('response', async () =>
      this.node.once('connected', async () => await this.onSyncGetData(randomPeer))
    );
  }

  private async onSyncGetData(randomPeer: IHost): Promise<void> {
    this.connected = true;
    const lookup = this.node.find({ key: 'blocks' });

    ConsoleLog('Found an alive peer. Looking up its data');

    /**** THE ITEM EXISTS ON THE NETWORK ****/
    lookup.once('found', async (result: any) => {
      const rootChain = result.value.chain;

      /** GET THIS LIVE REMOTE PEER PEERS **/
      await this.onSyncGetPeers(randomPeer);

      /** GET THIS LIVE REMOTE PEER UNCONFIRMED TRANSACTIONS **/
      await this.onSyncGetTransactions(randomPeer);

      /** SAVING TO FILE STARTS **/
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
    lookup.once('timeout', () => {
      ConsoleLog('Find request timed out');
    });
  }

  private async onSyncGetPeers(randomPeer: IHost): Promise<void> {
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
      } else {
        console.log(`${ROOT_NODE_ADDRESS}/get-peers`, error);
      }
    });
  }

  private async onSyncGetTransactions(randomPeer: IHost): Promise<void> {
    request(
      { url: `http://${randomPeer.host}:2000/transaction-pool` },
      async (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootTransactionPoolMap = JSON.parse(body).message;

          // CHECK EMPTY
          if (isEmptyObject(rootTransactionPoolMap))
            ConsoleLog('No new transaction coming in from the network');
          // NOT EMPTY
          if (!isEmptyObject(rootTransactionPoolMap)) {
            ConsoleLog('Adding latest unconfirmed TRANSACTIONS to your node');
            ConsoleLog('working on it...');
            this.transactionPool.setMap(rootTransactionPoolMap);
            ConsoleLog('Done');
          }
        } else {
          console.log(`${ROOT_NODE_ADDRESS}/transaction-pool`, error);
        }
      }
    );
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
    const peers = JSON.parse(await this.getPeers()) as IHost[];

    // FOR EACH PEER
    peers.forEach(peer => {
      if (sender.host != peer.host) {
        // CONNECT THIS PEER TO THE REMOTE PEER
        this.node.connect({ host: peer.host, port: peer.port });
        // DO THIS ONCE CONNECTED
        this.node.once('connected', () => {
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
