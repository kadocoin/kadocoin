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
  P2P_PORT,
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
import { KADOCOIN_VERSION } from '../config/constants';
import LevelDB from '../db';
import { resolve } from 'path';

class P2P {
  private peer: any; // PEER LIBRARY IS NOT TYPED THAT IS WHY IT IS `any`
  private blockchain: Blockchain;
  private transactionPool: TransactionPool;
  private hardCodedPeers: IHost[];
  private has_connected_to_a_peer__blks: boolean;
  private has_connected_to_a_peer__txs: boolean;
  private loopCount: number;
  private ip_address: string;
  private leveldb: LevelDB;

  constructor({
    blockchain,
    transactionPool,
    peer,
    ip_address,
    leveldb,
  }: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    peer: any;
    ip_address: string;
    leveldb: LevelDB;
  }) {
    this.peer = peer;
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.leveldb = leveldb;
    this.hardCodedPeers = hardCodedPeers;
    this.has_connected_to_a_peer__blks = false;
    this.has_connected_to_a_peer__txs = false;
    this.loopCount = 0;
    this.ip_address = ip_address;
    this.receiveTransactions();
    this.receiveBlock();
    this.onSyncReceiveRequestingPeerInfo();
    this.onStartAddPeersFromFileToWellKnownPeers();
  }

  private onStartAddPeersFromFileToWellKnownPeers(): void {
    this.getPeers().then(localPeers => this.addToWellKnownPeers(localPeers));
  }

  private receiveTransactions(): void {
    this.peer.handle.receiveTransactions = async (payload: any, done: any) => {
      if (payload.data.message) {
        logger.info('INCOMING TRANSACTION', payload.data.message);

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
        const peersNotPresentInLocal = this.removeDuplicatePeers({
          peersThatNeedDupsRemoved: incomingPeers,
          currentPeers: localPeers,
        });

        // ADD PEER TO MEMORY'S WELLKNOWN PEER
        this.addToWellKnownPeers(peersNotPresentInLocal);

        // SAVE PEER TO FILE
        appendToFile(peersNotPresentInLocal, peersStorageFile);

        return done(null, 'txn-200');
      }

      return done(new Error('Invalid txn'));
    };
  }

  public async sendTransactions(transaction: Transaction): Promise<void> {
    const aboutThisPeer = this.peerInfo();
    const localPeers = await this.getPeers();

    /** FOR EACH PEER */
    hardCodedPeers.forEach(peer => {
      if (peer.host !== this.ip_address) {
        logger.info('Sending txn to: ', { peer });

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
          .run('handle/receiveTransactions', { data: message }, (err: any, result: any) => {
            if (result == 'txn-200') logger.info('Success sending txn to: ', { peer });

            if (err) logger.error('Error sending txn to: ', { peer });
          });
      }
    });
  }

  private async forwardTransactionToPeers(
    transaction: Transaction,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    const localPeers = await this.getPeers();

    // FOR EACH PEER FORWARD THE TRANSACTION
    if (localPeers.length) {
      localPeers.forEach((peer: IHost) => {
        // DO NOT SEND THIS TXS TO THE SENDER OR TO THIS PEER
        if (sender.host != peer.host && peer.host != this.ip_address) {
          logger.info('FORWARDING TRANSACTION TO:', { peer });

          const message = {
            type: 'TRANSACTION',
            message: {
              transaction,
              info: {
                sender: sender,
                senderPeers: localPeers,
              },
            },
          };

          this.peer
            .remote({
              host: peer.host,
              port: peer.port,
            })
            .run('handle/receiveTransactions', { data: message }, (forwarding_err: Error) => {
              if (forwarding_err) {
                logger.warn('Failed to send txn to', { peer });
              }
            });
        }
      });
    }
  }

  private receiveBlock(): void {
    this.peer.handle.receiveBlockFromPeers = (payload: any, done: any) => {
      if (payload.data.message.block) {
        logger.info('INCOMING BLOCK', payload.data.message);

        // CHECK FOR EXISTING BLOCK
        const isExistingBlock = this.isExistingBlock({ incomingBlock: payload.data.message.block });

        if (!isExistingBlock) {
          this.blockchain.addBlockFromPeerToLocal(
            payload.data.message,
            true,
            this.blockchain.chain,
            () => {
              // REMOVE ALL THE TRANSACTIONS ON THIS PEER THAT ARE CONTAINED IN THE NEW SENT BLOCK
              this.transactionPool.clearBlockchainTransactions({
                chain: [payload.data.message.block],
              });

              // SAVE TRANSACTIONS FROM THE BLOCK TO DB
              this.leveldb.addOrUpdateBal([payload.data.message.block]);
              return done(null, 'blk-200');
            }
          );

          /**
           * NO DUPLICATES - FORWARD TRANSACTION TO PEERS
           */
          this.forwardBlockToPeers(payload.data.message);
        }

        if (isExistingBlock) logger.info("I have this BLOCK. I'M NOT FORWARDING IT.");
        return;
      }
      return done(new Error('blk-500'));
    };
  }

  public async sendBlockToPeers({ block }: { block: Block }): Promise<void> {
    const aboutThisPeer = this.peerInfo();
    const localPeers = await this.getPeers();
    const combinedPeers = hardCodedPeers.concat(localPeers);

    /** FOR EACH PEER */
    combinedPeers.forEach(peer => {
      if (peer.host !== this.ip_address) {
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
          .run('handle/receiveBlockFromPeers', { data: message }, (err: any, result: any) => {
            if (result == 'blk-200') logger.info('Success sending block to:', { peer });

            if (err) logger.warn('Error sending block to:', { peer });
          });
      }
    });
  }

  private async forwardBlockToPeers(incomingObj: incomingObj): Promise<void> {
    const peers = await this.getPeers();

    // FOR EACH PEER FORWARD THE RECENTLY MINED BLOCK
    if (peers.length) {
      peers.forEach((peer: IHost) => {
        if (incomingObj.info.sender.host != peer.host && peer.host != this.ip_address) {
          logger.info(`FORWARDING BLOCK TO`, { peer });

          const message = {
            type: 'BLOCK',
            message: {
              block: incomingObj.block,
              info: incomingObj.info,
            },
          };

          this.peer
            .remote({
              host: peer.host,
              port: peer.port,
            })
            .run('handle/receiveBlockFromPeers', { data: message }, (forwarding_blk_err: Error) => {
              if (forwarding_blk_err) logger.warn('Failed to send new blk to', { peer });
            });
        }
      });
    }
  }

  // public async syncPeerWithHistoricalBlockchain(): Promise<string[]> {
  //   // LOOP THRU HARDCODED PEERS
  //   const status = await this.loopAndRunPeers(this.hardCodedPeers);
  //   return status;

  //   // THE BELOW CODE WILL RUN IF NONE OF THE HARDCODED PEERS IS ALIVE
  //   // if (
  //   //   !this.has_connected_to_a_peer__blks ||
  //   //   (!this.has_connected_to_a_peer__txs && this.loopCount == this.hardCodedPeers.length - 1)
  //   // ) {
  //   //   console.log('');
  //   //   console.log('RETRIEVING PEERS FROM LOCAL FILE');
  //   //   const peers = await this.getPeers();

  //   //   if (peers.length) {
  //   //     if (peers) {
  //   //       await this.loopAndRunPeers(peers);
  //   //       logger.info('NONE OF THE HARDCODED AND LOCAL PEERS ARE ALIVE');
  //   //     }
  //   //   }
  //   // }
  // }

  private async loopAndRunPeers2(peers: Array<IHost>): Promise<boolean> {
    for (let i = 0; i < peers.length; i++) {
      if (peers[i].host !== this.ip_address) {
        this.loopCount++;

        //  ATTEMPT TO CONNECT TO PEER
        logger.info('Attempting to connect to', { host: peers[i].host, port: peers[i].port });

        await this.getBlockchainDataFromPeer(peers[i]);

        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (this.has_connected_to_a_peer__blks && this.has_connected_to_a_peer__txs) {
        logger.info('Found a peer. Exiting...');
        return true;
      }
    }
  }
  async loopAndRunPeers(peers: Array<IHost>): Promise<string[]> {
    for (const peer of peers) {
      if (peer.host !== this.ip_address) {
        this.loopCount++;

        //  ATTEMPT TO CONNECT TO PEER
        logger.info('Attempting to connect to', { host: peer.host, port: peer.port });

        const results = await new Promise(async (resolve: (value: string[]) => void) => {
          const statuses = await this.getBlockchainDataFromPeer(peer);
          resolve(statuses);
        });

        if (results[0] == 'txn-500' || results[1] == 'blk-500') {
          if (this.loopCount == this.hardCodedPeers.length - 1) {
            logger.info('NONE OF THE HARDCODED ALIVE');
            // GET LOCAL FILES
            logger.info('RETRIEVING PEERS FROM LOCAL FILE');

            const peers = await this.getPeers();

            if (peers.length) {
              await this.loopAndRunPeers(peers);
              logger.info('NONE OF THE HARDCODED AND LOCAL PEERS ARE ALIVE');
            }

            console.log('------------------------------------------');
            return results;
          }
        } else {
          console.log('im done');
          return results;
        }
      }
    }
  }

  private async getBlockchainDataFromPeer(peer: IHost): Promise<string[]> {
    /** GET THIS LIVE REMOTE PEER PEERS **/
    // this.onSyncGetPeers(peer);

    /** GET THIS LIVE REMOTE PEER UNCONFIRMED TRANSACTIONS **/
    // const txn_sync_status = await this.onSyncGetTransactions(peer);

    // GET BLOCKS DATA FROM OTHER PEERS
    // const blks_sync_status = await this.onSyncGetBlocks(peer);

    const statuses = await Promise.all([
      this.onSyncGetTransactions(peer),
      this.onSyncGetBlocks(peer),
    ]);

    return statuses;
  }

  private onSyncGetPeers(peer: IHost): void {
    this.peer
      .remote({
        host: peer.host,
        port: peer.port,
      })
      .run(
        '/handle/sendPeersToRequesterAndRequesterInfoToSupplier',
        { data: JSON.stringify([{ host: this.ip_address, port: P2P_PORT }]) },
        async (err: Error, result: any) => {
          if (!err && result) {
            const incomingPeers = result;

            if (incomingPeers.length) {
              // SAVE PEERS TO FILE AND ADD TO WELLKNOWN PEERS IN MEMORY
              await this.savePeersToFileAndAddToWellKnownPeers({
                incomingPeers: JSON.stringify(incomingPeers),
              });
            }
          } else {
            logger.warn(
              `${peer.host}:${peer.port}/handle/sendPeersToRequesterAndRequesterInfoToSupplier- ${err}`
            );
          }
        }
      );
  }

  // WHEN A NODE STARTS, IT SENDS A REQUEST TO OTHER PEER(S).
  // THE OTHER PEER(S) RECEIVE THE REQUESTING PEER'S IP ADDRESS AND PORT NUMBER
  // THEY ADD THE IP AND PORT TO THEIR LIST OF KNOWN PEERS USING THE
  // METHOD BELOW
  private onSyncReceiveRequestingPeerInfo(): void {
    this.peer.handle.sendPeersToRequesterAndRequesterInfoToSupplier = async (
      payload: { data: any },
      done: (err: Error, result: string) => void
    ) => {
      // SAVE PEERS TO FILE AND ADD TO WELLKNOWN PEERS IN MEMORY
      const localPeers = await this.savePeersToFileAndAddToWellKnownPeers({
        incomingPeers: payload.data,
      });

      // SEND THE REQUESTING PEER MY LOCAL PEERS
      return done(null, JSON.stringify(localPeers));
    };
  }

  private async savePeersToFileAndAddToWellKnownPeers({
    incomingPeers,
  }: {
    incomingPeers: string;
  }): Promise<IHost[]> {
    try {
      /** GET LOCAL PEERS */
      const localPeers = await this.getPeers();
      const peersNotPresentInLocal = this.removeDuplicatePeers({
        peersThatNeedDupsRemoved: JSON.parse(incomingPeers),
        currentPeers: localPeers,
      });

      if (peersNotPresentInLocal.length) {
        logger.info(`Found ${peersNotPresentInLocal.length}(s) incoming peers`);
        logger.info('Adding remote peer to file');

        // ADD PEER TO MEMORY'S WELLKNOWN PEER
        this.addToWellKnownPeers(peersNotPresentInLocal);

        // SAVE PEER TO FILE
        appendToFile(peersNotPresentInLocal, peersStorageFile);

        logger.info(`Added ${peersNotPresentInLocal.length} remote peer(s) to file`);

        return localPeers;
      }
    } catch (error) {
      console.log('Error adding peers to local file.', error);
      return [];
    }
  }

  private onSyncGetTransactions2(peer: IHost): void {
    request(
      { url: `http://${peer.host}:2000/transaction-pool`, timeout: REQUEST_TIMEOUT },
      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootTransactionPoolMap = JSON.parse(body).message;
          this.has_connected_to_a_peer__txs = true;

          // NO TRANSACTIONS TO ADD TO THIS PEER
          if (isEmptyObject(rootTransactionPoolMap))
            logger.info('No new transaction coming in from the network');

          // YES TRANSACTIONS TO ADD TO THIS PEER
          if (!isEmptyObject(rootTransactionPoolMap))
            this.transactionPool.onSyncAddTransactions(rootTransactionPoolMap);
        } else {
          logger.warn(`${peer.host}:2000/transaction-pool - ${error}`);
        }
      }
    );
  }

  private onSyncGetTransactions(peer: IHost): Promise<string> {
    return new Promise(resolve => {
      request(
        { url: `http://${peer.host}:2000/transaction-pool`, timeout: REQUEST_TIMEOUT },
        (error, response, body) => {
          if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body).message;

            // NO TRANSACTIONS TO ADD TO THIS PEER
            if (isEmptyObject(rootTransactionPoolMap))
              logger.info('No new transaction coming in from the network');

            // YES TRANSACTIONS TO ADD TO THIS PEER
            if (!isEmptyObject(rootTransactionPoolMap))
              this.transactionPool.onSyncAddTransactions(rootTransactionPoolMap);

            resolve('txn-200');
          } else {
            resolve('txn-500');
            logger.warn(`${peer.host}:2000/transaction-pool - ${error}`);
          }
        }
      );
    });
  }

  private async onSyncGetBlocks(peer: IHost): Promise<string> {
    return new Promise(resolve => {
      request(
        { url: `http://${peer.host}:2000/blocks`, timeout: REQUEST_TIMEOUT },
        async (error, response, body) => {
          if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body).message;

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

            // TODO: SYNC FROM DISK ?
            // IF HEIGHT IS THE SAME, MAYBE DO A SHALLOW CHECK LIKE CHECKING ALL HASHES?

            this.blockchain.replaceChain(rootChain);

            /**  UPDATE MINING_REWARD */
            const { MINING_REWARD, SUPPLY } = new Mining_Reward().calc({
              chainLength: this.blockchain.chain.length,
            });

            logger.info(`Mining reward and supply`, {
              MINING_REWARD,
              SUPPLY,
            });
            resolve('blk-200');
          } else {
            logger.warn(`${peer.host}:2000/blocks - ${error}`);
            resolve('blk-500');
          }
        }
      );
    });
  }

  private removeDuplicatePeers({
    peersThatNeedDupsRemoved,
    currentPeers,
  }: {
    peersThatNeedDupsRemoved: Array<IHost>;
    currentPeers: Array<IHost>;
  }) {
    const peersNotPresentInLocal = [];
    const localHosts = new Map();

    for (let j = 0; j < currentPeers.length; j++) {
      localHosts.set(currentPeers[j].host, currentPeers[j].port);
    }

    for (let i = 0; i < peersThatNeedDupsRemoved.length; i++) {
      const peer = peersThatNeedDupsRemoved[i];

      if (!localHosts.has(peer.host) && peer.host != this.ip_address)
        peersNotPresentInLocal.push(peer);
    }

    return peersNotPresentInLocal;
  }

  private peerInfo(): { host: string; port: number; id: string } {
    return {
      host: this.ip_address,
      port: this.peer.self.port,
      id: this.peer.self.id,
    };
  }

  public async getPeers(): Promise<Array<IHost>> {
    if (fs.existsSync(peersStorageFile)) {
      return getFileContentLineByLine(peersStorageFile);
    }
    return [];
  }

  public isExistingBlock({ incomingBlock }: { incomingBlock: Block }): boolean {
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

  private addToWellKnownPeers(peersToAdd: IHost[]): void {
    const currentWellKnownPeers = this.peer.wellKnownPeers.get();
    const dupsPeersRemoved = this.removeDuplicatePeers({
      peersThatNeedDupsRemoved: peersToAdd,
      currentPeers: currentWellKnownPeers,
    });

    for (let i = 0; i < dupsPeersRemoved.length; i++) {
      this.peer.wellKnownPeers.add(dupsPeersRemoved[i]);
    }
  }
}

export default P2P;
