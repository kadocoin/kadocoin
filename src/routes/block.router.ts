/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Application } from 'express';
import LevelDB from '../db';
import BlockController from '../controllers/block.controller';
import { leveldbMiddleWare } from '../middleware/cryptoMiddleWare';

export class BlockRouter {
  private app: Application;
  private blockController: BlockController;
  private leveldb: LevelDB;

  constructor(app: Application, leveldb: LevelDB) {
    this.app = app;
    this.leveldb = leveldb;
    this.blockController = new BlockController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.get(
      '/get-blocks',
      leveldbMiddleWare(this.leveldb),
      this.blockController.getBlocksByRange
    );

    this.app.get(
      '/get-block-by-hash/:hash',
      leveldbMiddleWare(this.leveldb),
      this.blockController.getBlockByHash
    );

    this.app.get(
      '/get-block-by-height/:height',
      leveldbMiddleWare(this.leveldb),
      this.blockController.getBlockByHeight
    );
  }
}
