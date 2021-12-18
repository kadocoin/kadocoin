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
import fs, { unlinkSync } from 'fs';
import { IHost, incomingObj } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import {
  blockchainStorageFile,
  hardCodedPeers,
  peersStorageFile,
  REQUEST_TIMEOUT,
} from '../config/constants';
import Block from '../blockchain/block';
import getLastLine from '../util/get-last-line';
import appendToFile from '../util/appendToFile';
import Mining_Reward from '../util/supply_reward';
import isEmptyObject from '../util/is-empty-object';
import getFileContentLineByLine from '../util/get-file-content-line-by-line';
import logger from '../util/logger';
import { KADOCOIN_VERSION } from '../config/secret';

class P2P {
  peer: any; // PEER LIBRARY IS NOT TYPED WHY IT IS `any`
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  hardCodedPeers: IHost[];
  has_connected_to_a_peer__blks: boolean;
  has_connected_to_a_peer__txs: boolean;
  loopCount: number;
  ip_address: string;

  constructor({
    blockchain,
    transactionPool,
    peer,
    ip_address,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    peer: any;
    ip_address: string;
  }) {
    this.peer = peer;
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.hardCodedPeers = hardCodedPeers;
    this.has_connected_to_a_peer__blks = false;
    this.has_connected_to_a_peer__txs = false;
    this.loopCount = 0;
    this.ip_address = ip_address;
    this.receiveTransactions();
    this.receiveBlock();
  }

  receiveTransactions(): void {
    this.peer.handle.receiveTransactions = async (payload: any, done: any, err: any) => {
      if (err) return done(err);

      if (payload.data.message && !err) {
        console.log({ INCOMING_TRANSACTION: payload.data.message });

        // CHECK FOR EXISTING TRANSACTION
        const existingTransaction = this.transactionPool.existingTransactionPool({
          inputAddress: payload.data.message.transaction.input.address,
        });

        // SAVE TRANSACTION TO MEMORY
        this.transactionPool.setTransaction(payload.data.message.transaction);

        // CHECK FOR DUPLICATE TRANSACTION IN MEMORY
        if (existingTransaction) {
          if (
            existingTransaction.input.timestamp == payload.data.message.transaction.input.timestamp
          ) {
            logger.info("I already have this transaction. I'M NOT FORWARDING IT.");
            return;
          }
        }

        /**
         * NO DUPLICATES - FORWARD TRANSACTION TO PEERS
         */

        this.forwardTransactionToPeers(
          payload.data.message.transaction,
          payload.data.message.info.sender
        );

        // ADD SENDER TO PEERS ON FILE
        const localPeers = await this.getPeers();
        const incomingPeers: IHost[] = payload.data.message.info.senderPeers;
        const sender = {
          host: payload.data.message.info.sender.host,
          port: payload.data.message.info.sender.port,
        };

        // ADD SENDER DETAILS
        incomingPeers.push(sender);

        // REMOVE PEERS FROM INCOMING PEERS THAT ARE ALREADY PRESENT LOCALLY
        const peersNotPresentInLocal = this.getPeersNotInLocal(incomingPeers, localPeers);

        appendToFile(peersNotPresentInLocal, peersStorageFile);
      }
    };
  }

  async sendTransactions(transaction: Transaction): Promise<void> {
    const aboutThisPeer = await this.peerInfo();
    const localPeers = await this.getPeers();

    /** FOR EACH PEER */
    hardCodedPeers.forEach(peer => {
      if (peer.host !== this.ip_address) {
        console.log({ sendingTxsTo: peer });

        const message = {
          type: 'TRANSACTION',
          message: {
            transaction,
            info: {
              sender: {
                host: aboutThisPeer.host,
                port: aboutThisPeer.port,
                id: aboutThisPeer.id,
                timestamp: new Date().getTime(),
              },
              senderPeers: localPeers,
            },
          },
        };

        this.peer
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
    this.peer.handle.receiveBlockFromPeers = (payload: any, done: any, err: any) => {
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
                chain: [payload.data.message.block],
              });
            }
          );

          /**
           * NO DUPLICATES - FORWARD TRANSACTION TO PEERS
           */
          this.forwardBlockToPeers(payload.data.message);
        }

        if (isExistingBlock) {
          logger.info("I already have this BLOCK. I'M NOT FORWARDING IT.");
          return;
        }
      }
    };
  }

  async sendBlockToPeers({ block }: { block: Block }): Promise<void> {
    const aboutThisPeer = await this.peerInfo();
    console.log({ block });

    /** FOR EACH PEER */
    hardCodedPeers.forEach(peer => {
      if (peer.host !== this.ip_address) {
        console.log({ sendingBlockTo: peer });

        const info = {
          KADOCOIN_VERSION,
          height: this.blockchain.chain.length,
          sender: {
            host: aboutThisPeer.host,
            port: aboutThisPeer.port,
            id: aboutThisPeer.id,
            timestamp: new Date().getTime(),
          },
        };

        const message = {
          type: 'BLOCK',
          message: {
            block,
            info,
          },
        };

        this.peer
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
    const peers = await this.getPeers();

    // FOR EACH PEER FORWARD THE RECENTLY MINED BLOCK
    if (peers.length) {
      logger.info('FORWARDING BLOCK TO MY PEERS.');

      peers.forEach((peer: IHost) => {
        if (incomingObj.info.sender.host != peer.host && peer.host != this.ip_address) {
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

          this.peer
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
    const peers = await this.getPeers();

    // FOR EACH PEER FORWARD THE TRANSACTION
    if (peers.length) {
      peers.forEach((peer: IHost) => {
        // DO NOT SEND THIS TXS TO THE SENDER OR TO THIS PEER
        if (sender.host != peer.host && peer.host != this.ip_address) {
          logger.info(`FORWARDING TRANSACTION TO: ${peer}`);

          const message = {
            type: 'TRANSACTION',
            message: transaction,
            sender,
          };

          this.peer
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

  async syncPeerWithHistoricalBlockchain(): Promise<boolean> {
    // LOOP THRU HARDCODED PEERS
    const status = await this.loopAndRunPeers(this.hardCodedPeers);

    // THE BELOW CODE WILL RUN IF NONE OF THE HARDCODED PEERS IS ALIVE
    if (
      !this.has_connected_to_a_peer__blks ||
      (!this.has_connected_to_a_peer__txs && this.loopCount == this.hardCodedPeers.length - 1)
    ) {
      console.log('');
      console.log('RETRIEVING PEERS FROM LOCAL FILE');
      const peers = await this.getPeers();

      if (peers.length) {
        if (peers) {
          await this.loopAndRunPeers(peers);
          logger.info('NONE OF THE HARDCODED AND LOCAL PEERS ARE ALIVE');
        }
      }
    }

    return status;
  }

  private async loopAndRunPeers(peers: Array<IHost>): Promise<boolean> {
    for (let i = 0; i < peers.length; i++) {
      logger.info('=============================');
      console.log({
        has_connected_to_a_peer__txs: this.has_connected_to_a_peer__txs,
        has_connected_to_a_peer__blks: this.has_connected_to_a_peer__blks,
      });

      if (peers[i].host !== this.ip_address) {
        this.loopCount++;
        //  PEER CONNECT ATTEMPT
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
        logger.info('Found a peer. Exiting...');
        return true;
      }
    }
  }

  private async getBlockchainDataFromPeer(peer: IHost): Promise<void> {
    /** GET THIS LIVE REMOTE PEER PEERS **/
    this.onSyncGetPeers(peer);

    /** GET THIS LIVE REMOTE PEER UNCONFIRMED TRANSACTIONS **/
    if (!this.has_connected_to_a_peer__txs) this.onSyncGetTransactions(peer);

    // GET BLOCKS DATA FROM OTHER PEERS
    if (!this.has_connected_to_a_peer__blks) this.onSyncGetBlocks(peer);
  }

  private onSyncGetPeers(peer: IHost): void {
    request(
      { url: `http://${peer.host}:2000/get-peers`, timeout: REQUEST_TIMEOUT },
      async (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const incomingPeers = JSON.parse(body).message;

          if (incomingPeers.length) {
            try {
              /** GET LOCAL PEERS */
              const localPeers = await this.getPeers();

              const peersNotPresentInLocal = this.getPeersNotInLocal(incomingPeers, localPeers);

              logger.info(`Found ${peersNotPresentInLocal.length}(s) incoming peers`);

              if (peersNotPresentInLocal.length) {
                logger.info('Adding remote peer to file');
                appendToFile(peersNotPresentInLocal, peersStorageFile);
                logger.info(`Added ${peersNotPresentInLocal.length} remote peer(s) to file`);
              }
            } catch (error) {
              console.log('Error adding peers to local file.', error);
            }
          }
        } else {
          logger.info(`${peer.host}:2000/get-peers - ${error}`);
        }
      }
    );
  }

  private onSyncGetTransactions(peer: IHost): void {
    request(
      { url: `http://${peer.host}:2000/transaction-pool`, timeout: REQUEST_TIMEOUT },
      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootTransactionPoolMap = JSON.parse(body).message;
          this.has_connected_to_a_peer__txs = true;

          // CHECK EMPTY
          if (isEmptyObject(rootTransactionPoolMap))
            logger.info('No new transaction coming in from the network');
          // NOT EMPTY
          if (!isEmptyObject(rootTransactionPoolMap)) {
            logger.info('Adding latest unconfirmed TRANSACTIONS to your peer...');
            this.transactionPool.setMap(rootTransactionPoolMap);
            logger.info('Done!');
          }
        } else {
          logger.info(`${peer.host}:2000/transaction-pool - ${error}`);
        }
      }
    );
  }

  private onSyncGetBlocks(peer: IHost): void {
    request(
      { url: `http://${peer.host}:2000/blocks`, timeout: REQUEST_TIMEOUT },
      async (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootChain = JSON.parse(body).message;
          this.has_connected_to_a_peer__blks = true;

          /** SAVING TO FILE STARTS */
          // FILE EXISTS
          if (fs.existsSync(blockchainStorageFile)) {
            const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
            const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
            logger.info('Incoming vs Local Blocks Status', {
              blockchainHeightFromPeer,
              blockchainHeightFromFile,
            });

            /** THIS PEER IS AHEAD */
            if (blockchainHeightFromPeer < blockchainHeightFromFile) {
              try {
                logger.info('THIS PEER IS AHEAD');
                // DELETE FILE
                unlinkSync(blockchainStorageFile);
                logger.info('FILE DELETED');
                // REPLACE WITH BLOCKS FROM PEER
                appendToFile(rootChain, blockchainStorageFile);
              } catch {
                logger.info('ERROR DELETING FILE');
              }
            }

            /** THIS PEER NEEDS TO CATCH UP */
            if (blockchainHeightFromPeer > blockchainHeightFromFile) {
              /** ADD THE MISSING BLOCKS TO LOCAL FILE */
              logger.info('ADD THE MISSING BLOCKS TO LOCAL FILE');
              // WRITE TO FILE: ADD THE DIFFERENCE STARTING FROM THE LAST BLOCK IN THE FILE
              const diffBlockchain = rootChain.slice(blockchainHeightFromFile);

              // NOW WRITE LINE BY LINE
              appendToFile(diffBlockchain, blockchainStorageFile);
            }
          } else {
            logger.info('FILE DOES NOT EXISTS');
            appendToFile(rootChain, blockchainStorageFile);
          }
          /** END SAVING TO FILE */

          logger.info('REPLACING YOUR LOCAL BLOCKCHAIN WITH THE CONSENSUS BLOCKCHAIN');
          logger.info('WORKING ON IT');

          // TODO: SYNC FROM DISK ?
          // IF HEIGHT IS THE SAME, MAYBE DO A SHALLOW CHECK LIKE CHECKING ALL HASHES?

          this.blockchain.replaceChain(rootChain);

          // UPDATE MINING_REWARD
          const { MINING_REWARD, SUPPLY } = new Mining_Reward().calc({
            chainLength: this.blockchain.chain.length,
          });
          logger.info(`Supply info`, {
            MINING_REWARD,
            SUPPLY,
          });
        } else {
          logger.warn(`${peer.host}:2000/blocks - ${error}`);
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

  async peerInfo(): Promise<{ host: string; port: number; id: string }> {
    return {
      host: this.ip_address,
      port: this.peer.self.port,
      id: this.peer.self.id,
    };
  }

  async getPeers(): Promise<Array<IHost>> {
    if (fs.existsSync(peersStorageFile)) {
      return getFileContentLineByLine(peersStorageFile);
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
