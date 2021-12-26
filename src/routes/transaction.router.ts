/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Application } from 'express';
import Blockchain from '../blockchain';
import TransactionController from '../controllers/transaction.controller';
import LevelDB from '../db';
import {
  blockchainMiddleWare,
  leveldbMiddleWare,
  p2pMiddleWare,
  transactionPoolMiddleWare,
  walletMiddleWare,
} from '../middleware/cryptoMiddleWare';
import { must_be_verified } from '../middleware/must_be_verified';
import Wallet from '../wallet';
import TransactionPool from '../wallet/transaction-pool';

export default class TransactionRouter {
  private app: Application;
  private transactionController: TransactionController;
  private transactionPool: TransactionPool;
  private blockchain: Blockchain;
  private p2p: any;
  private localWallet: Wallet;
  leveldb: LevelDB;

  constructor(
    app: Application,
    transactionPool: TransactionPool,
    blockchain: Blockchain,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    p2p: any,
    localWallet: Wallet,
    leveldb: LevelDB
  ) {
    this.app = app;
    this.transactionPool = transactionPool;
    this.blockchain = blockchain;
    this.p2p = p2p;
    this.transactionController = new TransactionController();
    this.localWallet = localWallet;
    this.leveldb = leveldb;
    this.initRoute();
  }

  initRoute(): void {
    this.app.post(
      '/transact',
      must_be_verified,
      walletMiddleWare(this.localWallet),
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      p2pMiddleWare(this.p2p),
      leveldbMiddleWare(this.leveldb),
      this.transactionController.make
    );

    // MULTI-WALLET ONLY
    this.app.post(
      '/send-without-account',
      walletMiddleWare(this.localWallet),
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      p2pMiddleWare(this.p2p),
      leveldbMiddleWare(this.leveldb),
      this.transactionController.send_without_account
    );

    this.app.get(
      '/transaction-pool',
      transactionPoolMiddleWare(this.transactionPool),
      this.transactionController.transactionPool
    );

    this.app.get(
      '/transaction/:id',
      transactionPoolMiddleWare(this.transactionPool),
      this.transactionController.transaction
    );

    this.app.post(
      '/mine-transactions',
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      p2pMiddleWare(this.p2p),
      leveldbMiddleWare(this.leveldb),
      this.transactionController.mine
    );
  }
}
