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
import fs from 'fs';
import { IHost } from '../types';
import Transaction from '../wallet/transaction';
import Blockchain from '../blockchain';
import TransactionPool from '../wallet/transaction-pool';
import ConsoleLog from '../util/console-log';
import getPeersFromFile from '../util/getPeersFromFile';
import { hardCodedPeers, peersStorageFile } from '../config/constants';
import Block from '../blockchain/block';

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
  hardCodedPeers: { host: string; port: number }[];
  connected: boolean;

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
        ConsoleLog('FORWARDING TRANSACTION TO MY PEERS.');
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

  receiveBlock(): void {
    this.node.handle.receiveBlock = (payload: any, done: any, err: any) => {
      if (err) return done(err);

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
          this.forwardBlockToPeers(payload.data.message, payload.data.sender);
        }

        if (isExistingBlock) {
          ConsoleLog("I already have this BLOCK. I'M NOT FORWARDING IT.");
          return;
        }
      }
    };
  }

  async forwardBlockToPeers(
    block: Block,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    const peers = JSON.parse(await this.getPeers()) as IHost[];

    // FOR EACH PEER
    peers.forEach(peer => {
      if (sender.host != peer.host || peer.host != local_ip) {
        console.log({ forwardingTo: peer });

        const message = {
          type: 'BLOCK',
          message: block,
          sender,
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

  async forwardTransactionToPeers(
    transaction: Transaction,
    sender: { host: string; port: number; id: string }
  ): Promise<void> {
    const peers = JSON.parse(await this.getPeers()) as IHost[];

    // FOR EACH PEER
    peers.forEach(peer => {
      console.log(
        { peer: peer.host, local_ip },
        sender.host != peer.host || peer.host != local_ip,
        sender.host != peer.host && peer.host != local_ip
      );

      if (sender.host != peer.host) {
        if (peer.host != local_ip) {
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

  async getPeers(): Promise<string> {
    if (fs.existsSync(peersStorageFile)) {
      return getPeersFromFile(peersStorageFile);
    }
    return '';
  }
}

export default P2P;
