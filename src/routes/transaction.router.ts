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
import {
  blockchainMiddleWare,
  pubSubMiddleWare,
  transactionPoolMiddleWare,
  walletMiddleWare,
} from '../middleware/cryptoMiddleWare';
import { must_be_verified } from '../middleware/must_be_verified';
import PubSub from '../pubSub';
import Wallet from '../wallet';
import TransactionPool from '../wallet/transaction-pool';

export default class TransactionRouter {
  private app: Application;
  private transactionController: TransactionController;
  private transactionPool: TransactionPool;
  private blockchain: Blockchain;
  private pubSub: PubSub;
  private localWallet: Wallet;

  constructor(
    app: Application,
    transactionPool: TransactionPool,
    blockchain: Blockchain,
    pubSub: PubSub,
    localWallet: Wallet
  ) {
    this.app = app;
    this.transactionPool = transactionPool;
    this.blockchain = blockchain;
    this.pubSub = pubSub;
    this.transactionController = new TransactionController();
    this.localWallet = localWallet;
    this.initRoute();
  }

  initRoute(): void {
    this.app.post(
      '/transact',
      must_be_verified,
      walletMiddleWare(this.localWallet),
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      pubSubMiddleWare(this.pubSub),
      this.transactionController.make
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
      pubSubMiddleWare(this.pubSub),
      this.transactionController.mine
    );
  }
}
