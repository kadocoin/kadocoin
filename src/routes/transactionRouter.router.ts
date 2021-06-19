import { Application } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { blockchainMiddleWare, pubSubMiddleWare, transactionPoolMiddleWare } from '../middleware/cryptoMiddleWare';
import { BaseRouter } from './common/baseRouter.router';

export class TransactionRouter implements BaseRouter {
  private app: Application;
  private transactionController: TransactionController;
  transactionPool: any;
  blockchain: any;
  pubSub: any;

  constructor(app: Application, transactionPool: any, blockchain: any, pubSub: any) {
    this.app = app;
    this.transactionPool = transactionPool;
    this.blockchain = blockchain;
    this.pubSub = pubSub;
    this.transactionController = new TransactionController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/api/transact', transactionPoolMiddleWare(this.transactionPool), blockchainMiddleWare(this.blockchain), pubSubMiddleWare(this.pubSub), this.transactionController.make);
    // this.app.get('/api/transaction-pool-map', this.transactionController.poolMap);
    // this.app.get('/api/mine-transactions', this.transactionController.mine)
    // this.app.get('/api/blocks', this.transactionController.getBlocks);
  }
}
