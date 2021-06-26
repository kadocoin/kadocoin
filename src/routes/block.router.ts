import { Application } from "express";
import Blockchain from "../blockchain";
import { BlockController } from "../controllers/block.controller";
import { blockchainMiddleWare } from "../middleware/cryptoMiddleWare";
import { BaseRouter } from "./common/baseRouter.router";

export class BlockRouter implements BaseRouter {
  private app: Application;
  private blockController: BlockController;
  private blockchain: Blockchain;

  constructor(app: Application, blockchain: Blockchain) {
    this.app = app;
    this.blockchain = blockchain;
    this.blockController = new BlockController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.get(
      "/api/blocks",
      blockchainMiddleWare(this.blockchain),
      this.blockController.getBlocks
    );

    this.app.get(
      "/api/block/:blockHash",
      blockchainMiddleWare(this.blockchain),
      this.blockController.getABlock
    );
  }
}
