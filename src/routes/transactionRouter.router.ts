import { Application } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { BaseRouter } from './common/baseRouter.router';

export class TransactionRouter implements BaseRouter {
  private app: Application;
  private transactionController: TransactionController;

  constructor(app: Application) {
    this.app = app;

    this.transactionController = new TransactionController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/api/transact', this.transactionController.make);
    this.app.get('/api/transaction-pool-map', this.transactionController.poolMap);
    this.app.get('/api/mine-transactions', this.transactionController.mine)
    this.app.get('/api/blocks', this.transactionController.getBlocks);
  }
}
