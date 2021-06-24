import { Application } from "express";
import { BlockController } from "../controllers/block.controller";
import { BaseRouter } from "./common/baseRouter.router";

export class BlockRouter implements BaseRouter {
  private app: Application;
  private blockController: BlockController;

  constructor(app: Application) {
    this.app = app;

    this.blockController = new BlockController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.get("/api/blocks", this.blockController.getBlocks);
  }
}
