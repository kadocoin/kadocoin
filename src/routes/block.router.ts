/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
import { Application } from 'express';
import Blockchain from '../blockchain';
import BlockController from '../controllers/block.controller';
import { blockchainMiddleWare } from '../middleware/cryptoMiddleWare';

export class BlockRouter {
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
      '/api/blocks',
      blockchainMiddleWare(this.blockchain),
      this.blockController.getBlocks
    );

    this.app.get(
      '/api/block/:blockHash',
      blockchainMiddleWare(this.blockchain),
      this.blockController.getABlock
    );
  }
}
