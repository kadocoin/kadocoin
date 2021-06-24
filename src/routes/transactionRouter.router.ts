import { Application } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import {
  blockchainMiddleWare,
  pubSubMiddleWare,
  transactionPoolMiddleWare,
  walletMiddleWare,
} from "../middleware/cryptoMiddleWare";
import { mustBeLoggedIn } from "../middleware/mustBeLoggedIn";
import { BaseRouter } from "./common/baseRouter.router";

export class TransactionRouter implements BaseRouter {
  private app: Application;
  private transactionController: TransactionController;
  transactionPool: any;
  blockchain: any;
  pubSub: any;
  localWallet: any;

  constructor(
    app: Application,
    transactionPool: any,
    blockchain: any,
    pubSub: any,
    localWallet: any
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
      "/api/transact",
      /**mustBeLoggedIn, */ walletMiddleWare(this.localWallet),
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      pubSubMiddleWare(this.pubSub),
      this.transactionController.make
    );
    this.app.get(
      "/api/transaction-pool-map",
      transactionPoolMiddleWare(this.transactionPool),
      this.transactionController.poolMap
    );
    this.app.post(
      "/api/mine-transactions",
      mustBeLoggedIn,
      transactionPoolMiddleWare(this.transactionPool),
      blockchainMiddleWare(this.blockchain),
      pubSubMiddleWare(this.pubSub),
      this.transactionController.mine
    );
    this.app.get(
      "/api/blocks",
      blockchainMiddleWare(this.blockchain),
      this.transactionController.getBlocks
    );
    this.app.get(
      "/api/block/:blockHash",
      blockchainMiddleWare(this.blockchain),
      this.transactionController.getABlock
    );
  }
}
