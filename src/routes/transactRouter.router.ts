import { Application } from "express";
import { TransactController } from "../controllers/transact.controller";
import { BaseRouter } from "./common/baseRouter.router";

export class TransactRouter implements BaseRouter {
  private app: Application;
  private transactController: TransactController;

  constructor(app: Application) {
    this.app = app;

    this.transactController = new TransactController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/api/transact', this.transactController.make);

    /**
     * @typedef Transact
     * @property {string} recipient.required - Some description for recipient
     * @property {string} amount.required - Some description for amount
     */
  }
}
