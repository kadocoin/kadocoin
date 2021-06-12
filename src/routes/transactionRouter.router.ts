import { Application } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { BaseRouter } from './common/baseRouter.router';

export class TransactionRouter implements BaseRouter {
  private app: Application;
  private transactController: TransactionController;

  constructor(app: Application) {
    this.app = app;

    this.transactController = new TransactionController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/api/transact', this.transactController.make);
    this.app.get('/api/transaction-pool-map', this.transactController.poolMap);
    this.app.get('/api/mine-transactions', this.transactController.mine)
  }
}
