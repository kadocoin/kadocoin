import { Application } from "express";
import Blockchain from "../blockchain";
import { TransactionController } from "../controllers/transaction.controller";
import {
  blockchainMiddleWare,
  pubSubMiddleWare,
  transactionPoolMiddleWare,
  walletMiddleWare,
} from "../middleware/cryptoMiddleWare";
import { mustBeLoggedIn } from "../middleware/mustBeLoggedIn";
import PubSub from "../pubSub";
import Wallet from "../wallet";
import TransactionPool from "../wallet/transaction-pool";
import { BaseRouter } from "./common/baseRouter.router";

export class TransactionRouter implements BaseRouter {
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
  }
}
