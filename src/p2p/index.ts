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
import { IHost } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import ConsoleLog from '../util/console-log';
import appendPeerToFile from '../util/appendPeerToFile';
import getPeersFromFile from '../util/getPeersFromFile';
import { blockchainStorageFile, hardCodedPeers, peersStorageFile } from '../config/constants';
import getLastLine from '../util/getLastLine';
import appendToFile from '../util/appendPeerToFile';
import Mining_Reward from '../util/supply_reward';
import EventEmitter from 'events';
import isEmptyObject from '../util/isEmptyObject';

// const MSG_TYPES = {
//   BLOCKCHAIN: 'BLOCKCHAIN',
//   TRANSACTION: 'TRANSACTION',
// };

let local_ip = '192.168.0.2'; // MAC

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
    this.transactionPool = transactionPool;
    this.connected = false;
    this.hardCodedPeers = hardCodedPeers;
    this.count = 0;
    this.count2 = 0;
    this.receiveTransactions();
    // this.onSyncSaveTransactions();
    // this.onSyncSaveBlockchain();
    this.onSyncSavePeers();
  }

  receiveTransactions(): void {
    this.node.handle.receiveTransactions = (payload: any, done: any, err: any) => {
      if (err) {
        console.log({ err });
        done(err);
      }

      if (payload.data.message && !err) {
        console.log({ incomingTransaction: payload.data.message });

        console.log('TRANSACTION');

        // CHECK FOR EXISTING TRANSACTION
        const existingTransaction = this.transactionPool.existingTransactionPool({
          inputAddress: payload.data.message.input.address,
        });

        // SAVE TRANSACTION TO MEMORY
        this.transactionPool.setTransaction(payload.data.message);

        // CHECK FOR DUPLICATE TRANSACTION IN MEMORY
        if (existingTransaction) {
          if (existingTransaction.input.timestamp == payload.data.message.input.timestamp) {
            ConsoleLog("I already have this transaction. I'M NOT FORWARDING IT.");
            return;
          }
        }

        /**
         * NO DUPLICATES - FORWARD TRANSACTION TO PEERS
         */
        ConsoleLog('FORWARDING TRANSACTION TO MY PEERS.');
        this.forwardTransactionToPeers(payload.data.message, payload.data.sender);
      }
    };
  }

  async sendTransactions(transaction: Transaction): Promise<void> {
    const aboutThisNode = await this.nodeInfo();

    // FOR EACH PEER
    hardCodedPeers.forEach(peer => {
      if (peer.host !== local_ip) {
        console.log({ sendingTxsTo: peer });

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
          .run('handle/receiveTransactions', { data: message }, (err: any, result: any) =>
            console.log({ err, result })
          );
      }
    });
  }

  async forwardTransactionToPeers(
    transaction: Transaction,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    const peers = JSON.parse(await this.getPeers()) as IHost[];

    // FOR EACH PEER
    peers.forEach(peer => {
      if (sender.host != peer.host) {
        console.log({ forwardingTo: peer });

        const message = {
          type: 'TRANSACTION',
          message: transaction,
          sender,
        };

        this.node
          .remote({
            host: peer.host,
            port: peer.port,
          })
          .run(
            'handle/receiveTransactions',
            { data: message },
            (forwarding_err: any, forwarding_result: any) =>
              console.log({ forwarding_err, forwarding_result })
          );
      }
    });
  }

  async syncNodeWithHistoricalBlockchain(): Promise<void> {
    console.time('adamu-timer');
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

  async loopAndRunPeers(peers: Array<IHost>): Promise<void> {
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

          await this.onSyncGetData(peers[i]);

          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } else {
        ConsoleLog('Found a peer that responded');

        break;
      }
    }
  }

  async onSyncGetData(randomPeer: IHost): Promise<void> {
    /** GET THIS LIVE REMOTE PEER PEERS **/
    await this.onSyncGetPeers(randomPeer);

    /** GET THIS LIVE REMOTE PEER UNCONFIRMED TRANSACTIONS **/
    // await this.onSyncGetTransactions(randomPeer);

    /** GET THIS LIVE REMOTE PEER BLOCKCHAIN **/
    // await this.onSyncGetBlockchain(randomPeer);
  }

  async onSyncGetPeers(randomPeer: IHost): Promise<void> {
    console.log('trying to get peers from', randomPeer);

    this.node
      .remote({
        host: randomPeer.host,
        port: randomPeer.port,
      })
      .run(
        'handle/syncpeers',
        { data: [{ host: '192.168.0.2', port: 5346 }] },
        (on_sync_peers__err: any, on_sync_peers__result: any) => {
          console.log({ on_sync_peers__err, on_sync_peers__result });
        }
      );
  }

  async onSyncSavePeers(): Promise<void> {
    this.node.handle.syncpeers = async (payload: any, done: any, err: any) => {
      console.log('inside of onSyncSavePeers', { err, payload: payload.data });
      if (err) {
        console.log({ onSyncSavePeers: err });
        done('error');
        return;
      }

      if (payload.data && !err) {
        this.connected = true;
        const incomingPeers = payload.data;

        if (incomingPeers) {
          try {
            /** GET LOCAL PEERS */

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
      }
    };
  }

  private async onSyncGetTransactions(randomPeer: IHost): Promise<void> {
    this.node
      .remote({
        host: randomPeer.host,
        port: randomPeer.port,
      })
      .run(
        'handle/onSyncGetTransactions',
        { data: this.transactionPool.transactionMap },
        (on_sync_txs__err: any, on_sync_txt__result: any) => {
          console.log({ on_sync_txs__err, on_sync_txt__result });

          if (on_sync_txt__result == 'success') {
            this.connected = true;
          }
        }
      );
  }

  private onSyncSaveTransactions(): void {
    this.node.handle.onSyncGetTransactions = (payload: any, done: any, err: any) => {
      if (err) {
        console.log({ onSyncSaveTransactions: err });
        done('error');
        return;
      }
      if (payload.data.message && !err) {
        // CHECK EMPTY
        if (isEmptyObject(payload.data.message))
          ConsoleLog('No new transaction coming in from the network');
        // NOT EMPTY
        if (!isEmptyObject(payload.data.message)) {
          ConsoleLog('Adding latest unconfirmed TRANSACTIONS to your node');
          ConsoleLog('working on it...');
          this.transactionPool.setMap(payload.data.message);
          ConsoleLog('Done');
        }

        done('success');
      }
    };
  }

  private async onSyncSaveBlockchain(): Promise<void> {
    this.node.handle.onSyncSaveBlockchain = async (payload: any, done: any, err: any) => {
      /** HANDLE ERRORS **/
      if (err) {
        console.log({ onSyncSaveBlockchain: err });
        done('error');
        return;
      }

      if (payload.data.message && !err) {
        const rootChain = payload.data.message;

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
        done('success');
      }
    };
  }

  private async onSyncGetBlockchain(randomPeer: IHost): Promise<void> {
    this.node
      .remote({
        host: randomPeer.host,
        port: randomPeer.port,
      })
      .run(
        'handle/onSyncSaveBlockchain',
        { data: this.blockchain.chain },
        (on_sync_chain__err: any, on_sync_chain__result: any) => {
          console.log({ on_sync_chain__err, on_sync_chain__result });

          if (on_sync_chain__result == 'success') {
            this.connected = true;
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

  async getPeers(): Promise<string> {
    if (fs.existsSync(peersStorageFile)) {
      return getPeersFromFile(peersStorageFile);
    }
    return '';
  }
}

export default P2P;
