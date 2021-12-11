/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import request from 'request';
import publicIp from 'public-ip';
import fs, { unlinkSync } from 'fs';
import { IHost, incomingObj } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import ConsoleLog from '../util/console-log';
import getPeersFromFile from '../util/getPeersFromFile';
import { blockchainStorageFile, hardCodedPeers, peersStorageFile } from '../config/constants';
import Block from '../blockchain/block';
import get_local_ip from '../util/local';
import getLastLine from '../util/getLastLine';
import appendToFile from '../util/appendToFile';
import Mining_Reward from '../util/supply_reward';
import isEmptyObject from '../util/isEmptyObject';
import appendPeerToFile from '../util/appendPeerToFile';

const local_ip = get_local_ip();

class P2P {
  node: any;
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  rpc: any;
  hardCodedPeers: IHost[];
  connected: boolean;
  has_connected_to_a_peer__blks: boolean;
  has_connected_to_a_peer__txs: boolean;
  loopCount: number;

  constructor({
    blockchain,
    transactionPool,
    node,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    node: any;
  }) {
    this.node = node;
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.connected = false;
    this.hardCodedPeers = hardCodedPeers;
    this.has_connected_to_a_peer__blks = false;
    this.has_connected_to_a_peer__txs = false;
    this.loopCount = 0;
    this.receiveTransactions();
    this.receiveBlock();
  }

  receiveTransactions(): void {
    this.node.handle.receiveTransactions = (payload: any, done: any, err: any) => {
      if (err) return done(err);

      if (payload.data.message && !err) {
        console.log({ INCOMING_TRANSACTION: payload.data.message });

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

        this.forwardTransactionToPeers(payload.data.message, payload.data.sender);
      }
    };
  }

  async sendTransactions(transaction: Transaction): Promise<void> {
    const aboutThisNode = await this.nodeInfo();

    /** FOR EACH PEER */
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

  receiveBlock(): void {
    this.node.handle.receiveBlockFromPeers = (payload: any, done: any, err: any) => {
      if (err) return done(err);

      console.log(payload.data.message);

      if (payload.data.message && !err) {
        console.log({ INCOMING_BLOCK: payload.data.message });

        // CHECK FOR EXISTING BLOCK
        const isExistingBlock = this.isExistingBlock({ incomingBlock: payload.data.message });

        if (!isExistingBlock) {
          this.blockchain.addBlockFromPeerToLocal(
            payload.data.message,
            true,
            this.blockchain.chain,
            () => {
              // TODO: CLEAR?
              this.transactionPool.clearBlockchainTransactions({
                chain: payload.data.message,
              });
            }
          );

          /**
           * NO DUPLICATES - FORWARD TRANSACTION TO PEERS
           */
          ConsoleLog('FORWARDING BLOCK TO MY PEERS.');
          this.forwardBlockToPeers(payload.data.message);
        }

        if (isExistingBlock) {
          ConsoleLog("I already have this BLOCK. I'M NOT FORWARDING IT.");
          return;
        }
      }
    };
  }

  async sendBlockToPeers({ block, info }: { block: Block; info: any }): Promise<void> {
    const aboutThisNode = await this.nodeInfo();
    console.log({ block, info });

    /** FOR EACH PEER */
    hardCodedPeers.forEach(peer => {
      if (peer.host !== local_ip) {
        console.log({ sendingBlockTo: peer });

        info.sender = {
          host: aboutThisNode.host,
          port: aboutThisNode.port,
          id: aboutThisNode.id,
          timestamp: new Date().getTime(),
        };

        const message = {
          type: 'BLOCK',
          message: {
            block,
            info,
          },
        };

        this.node
          .remote({
            host: peer.host,
            port: peer.port,
          })
          .run('handle/receiveBlockFromPeers', { data: message }, (err: any, result: any) =>
            console.log({ err, result })
          );
      }
    });
  }

  async forwardBlockToPeers(incomingObj: incomingObj): Promise<void> {
    let peers = await this.getPeers();

    if (peers) {
      peers = JSON.parse(peers as string) as [];

      // FOR EACH PEER
      peers.forEach((peer: IHost) => {
        if (incomingObj.info.sender.host != peer.host && peer.host != local_ip) {
          console.log({ forwardingBlockTo: peer });

          incomingObj.info.sender = {
            host: incomingObj.info.sender.host,
            port: incomingObj.info.sender.port,
            id: incomingObj.info.sender.id,
            timestamp: new Date().getTime(),
          };

          const message = {
            type: 'BLOCK',
            message: incomingObj,
          };

          this.node
            .remote({
              host: peer.host,
              port: peer.port,
            })
            .run(
              'handle/receiveBlock',
              { data: message },
              (forwarding_blk_err: any, forwarding_blk_result: any) =>
                console.log({ forwarding_blk_err, forwarding_blk_result })
            );
        }
      });
    }
  }

  async forwardTransactionToPeers(
    transaction: Transaction,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    let peers = await this.getPeers();

    if (peers) {
      ConsoleLog('FORWARDING TRANSACTION TO MY PEERS.');
      peers = JSON.parse(peers as string) as [];

      // FOR EACH PEER
      peers.forEach((peer: IHost) => {
        if (sender.host != peer.host && peer.host != local_ip) {
          console.log({ forwardingTxsTo: peer });

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
  }

  // start
  async syncNodeWithHistoricalBlockchain(): Promise<boolean> {
    // LOOP THRU HARDCODED PEERS
    console.log({ hardcodedPeers: this.hardCodedPeers });
    const status = await this.loopAndRunPeers(this.hardCodedPeers);
    console.log({ status });
    console.log({ loopCount: this.loopCount });

    // THE BELOW CODE WILL RUN IF NONE OF THE HARDCODED PEERS IS ALIVE
    if (!status && this.loopCount == this.hardCodedPeers.length - 1) {
      console.log('');
      console.log('RETRIEVING PEERS FROM LOCAL FILE');
      const peers = await this.getPeers();
      console.log({ peers });
      if (peers.length) {
        const peersParsed = JSON.parse(peers as string);

        if (peersParsed) {
          await this.loopAndRunPeers(peersParsed);
          ConsoleLog('NONE OF THE HARDCODED AND LOCAL PEERS ARE ALIVE');
        }
      }
    }

    return status;
  }

  private async loopAndRunPeers(peers: Array<IHost>): Promise<boolean> {
    for (let i = 0; i < peers.length; i++) {
      ConsoleLog('=============================');
      console.log({
        has_connected_to_a_peer__txs: this.has_connected_to_a_peer__txs,
        has_connected_to_a_peer__blks: this.has_connected_to_a_peer__blks,
      });

      console.log(peers[i].host, local_ip);
      if (peers[i].host !== local_ip) {
        this.loopCount++;
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

        await this.getBlockchainDataFromPeer(peers[i]);

        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (this.has_connected_to_a_peer__blks && this.has_connected_to_a_peer__txs) {
        ConsoleLog('Found a peer. Exiting...');
        return true;
      }

      return false;
    }
  }

  private async getBlockchainDataFromPeer(peer: IHost): Promise<void> {
    /** GET THIS LIVE REMOTE PEER PEERS **/
    this.onSyncGetPeers(peer);

    /** GET THIS LIVE REMOTE PEER UNCONFIRMED TRANSACTIONS **/
    if (!this.has_connected_to_a_peer__txs) this.onSyncGetTransactions(peer);

    // GET BLOCKCHAIN DATA FROM OTHER PEERS
    if (!this.has_connected_to_a_peer__blks) this.onSyncGetBlocks(peer);
  }

  private onSyncGetPeers(peer: IHost): void {
    request({ url: `http://${peer.host}:2000/get-peers` }, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        let incomingPeers = JSON.parse(body).message;

        if (incomingPeers.length) {
          try {
            /** GET LOCAL PEERS */
            incomingPeers = JSON.parse(incomingPeers);

            let localPeers = (await this.getPeers()) as string | Array<IHost>;

            if (localPeers) {
              localPeers = JSON.parse(localPeers as string);
            }
            const peersNotPresentInLocal = this.getPeersNotInLocal(
              incomingPeers,
              (localPeers = [])
            );

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
        ConsoleLog(`${peer.host}:2000/get-peers - ${error}`);
      }
    });
  }

  private onSyncGetTransactions(peer: IHost): void {
    request({ url: `http://${peer.host}:2000/blocks` }, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body).message;
        this.has_connected_to_a_peer__blks = true;

        /** SAVING TO FILE STARTS */
        // FILE EXISTS
        if (fs.existsSync(blockchainStorageFile)) {
          const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
          const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
          ConsoleLog(
            `blockchainHeightFromPeer: ${blockchainHeightFromPeer}, blockchainHeightFromFile: ${blockchainHeightFromFile}`
          );

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
        ConsoleLog(`MINING_REWARD: ${MINING_REWARD}, SUPPLY: ${SUPPLY}`);
      } else {
        ConsoleLog(`${peer.host}:2000/blocks - ${error}`);
      }
      ConsoleLog('============================================');
    });
  }

  private onSyncGetBlocks(peer: IHost): void {
    request({ url: `http://${peer.host}:2000/transaction-pool` }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body).message;
        this.has_connected_to_a_peer__txs = true;

        // CHECK EMPTY
        if (isEmptyObject(rootTransactionPoolMap))
          ConsoleLog('No new transaction coming in from the network');
        // NOT EMPTY
        if (!isEmptyObject(rootTransactionPoolMap)) {
          ConsoleLog('Adding latest unconfirmed TRANSACTIONS to your node');
          ConsoleLog('working on it...');
          this.transactionPool.setMap(rootTransactionPoolMap);
          ConsoleLog('Done!');
        }
      } else {
        ConsoleLog(`${peer.host}:2000/transaction-pool - ${error}`);
      }
      ConsoleLog('============================================');
    });
  }

  // end

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

  async getPeers(): Promise<string | []> {
    if (fs.existsSync(peersStorageFile)) {
      return getPeersFromFile(peersStorageFile);
    }
    return [];
  }

  isExistingBlock({ incomingBlock }: { incomingBlock: Block }): boolean {
    let is_duplicate = false;
    for (let i = 0; i < this.blockchain.chain.length; i++) {
      const block = this.blockchain.chain[i];

      if (incomingBlock.hashOfAllHashes === block.hashOfAllHashes) {
        is_duplicate = true;
      }

      if (is_duplicate) break;
    }

    return is_duplicate;
  }
}

export default P2P;
