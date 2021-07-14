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
import { mustBeLoggedIn } from '../middleware/mustBeLoggedIn';
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
    /**
     * @swagger
     * /api/transact:
     *  post:
     *    description: API for making a transaction
     *    tags:
     *     - Transaction
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    parameters:
     *    - in: body
     *      name: Transaction API
     *      schema:
     *        $ref: '#/definitions/transaction'
     *    responses:
     *        201:
     *            description: success
     *        400:
     *            description: bad request
     *        500:
     *            description: internal server error
     * definitions:
     *    transaction:
     *        type: object
     *        required:
     *        - amount
     *        - recipient
     *        - publicKey
     *        - address
     *        properties:
     *            amount:
     *                type: string
     *                example: 50
     *            recipient:
     *                type: string
     *                example: '0xf13C09968D48271991018A956C49940c41eCb1c3'
     *            publicKey:
     *                type: string
     *                example: '0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4'
     *            address:
     *                type: string
     *                example: '0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD'
     *            message:
     *                type: string
     *                example: 'Hello World'
     *            sendFee:
     *                type: string
     *                example: '0.0003'
     */
    this.app.post(
      '/api/transact',
      walletMiddleWare(this.localWallet),
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      pubSubMiddleWare(this.pubSub),
      this.transactionController.make
    );
    /**
     * @swagger
     * /api/transaction-pool-map:
     *  get:
     *    description: Get all transactions in the transaction pool
     *    tags:
     *     - Transaction Pool
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    responses:
     *        200:
     *            description: success
     *        400:
     *            description: bad request
     *        500:
     *            description: internal server error
     * definitions:
     *    transaction-pool:
     *        type: object
     *        required:
     *        - address
     *        properties:
     *            address:
     *                type: string
     *                example: '0xf13C09968D48271991018A956C49940c41eCb1c3'
     *            message:
     *                type: string
     *                example: 'Kadocoin to the Galaxies!'
     */
    this.app.get(
      '/api/transaction-pool-map',
      transactionPoolMiddleWare(this.transactionPool),
      this.transactionController.poolMap
    );
    /**
     * @swagger
     * /api/mine-transactions:
     *  post:
     *    description: Validate transactions in the transaction pool A.K.A. mining
     *    tags:
     *     - Mine Transactions
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    parameters:
     *    - in: body
     *      name: Transactions Validation API
     *      schema:
     *        $ref: '#/definitions/mine-transactions'
     *    responses:
     *        200:
     *            description: success
     *        400:
     *            description: bad request
     *        500:
     *            description: internal server error
     * definitions:
     *    mine-transactions:
     *        type: object
     *        required:
     *        - address
     *        properties:
     *            address:
     *                type: string
     *                example: '0xf13C09968D48271991018A956C49940c41eCb1c3'
     *            message:
     *                type: string
     *                example: 'Kadocoin to the Galaxies!'
     */
    this.app.post(
      '/api/mine-transactions',
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      pubSubMiddleWare(this.pubSub),
      this.transactionController.mine
    );
  }
}
