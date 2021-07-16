/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
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
    /**
     * @swagger
     * /api/blocks:
     *  get:
     *    description: Get all blocks in the blockchain. The blockchain consists of blocks.
     *    tags:
     *     - Blocks in the blockchain
     *    summary: "Returns the blockchain which contain all validated blocks"
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    responses:
     *        200:
     *            description: success
     *        500:
     *            description: internal server error
     */
    this.app.get(
      '/api/blocks',
      blockchainMiddleWare(this.blockchain),
      this.blockController.getBlocks
    );

    /**
     * @swagger
     * /api/block/:blockHash:
     *  get:
     *    description: Get a specific block in the blockchain using its hash.
     *    tags:
     *     - Get a Specific Block in the Blockchain
     *    summary: "Returns a specific block in the blockchain"
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    parameters:
     *    - in: path
     *    name: blockHash
     *    required: true
     *    schema:
     *     type: string
     *    responses:
     *        200:
     *            description: success
     *        400:
     *            description: not found
     *        500:
     *            description: internal server error
     */

    this.app.get(
      '/api/block/:blockHash',
      blockchainMiddleWare(this.blockchain),
      this.blockController.getABlock
    );
  }
}
