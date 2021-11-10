/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Application } from 'express';
import P2PController from '../controllers/p2p.controller';
import { p2pMiddleWare } from '../middleware/cryptoMiddleWare';
import P2P from '../p2p';

export default class P2PRouter {
  private app: Application;
  private P2PController: P2PController;
  p2p: P2P;

  constructor(app: Application, p2p: P2P) {
    this.app = app;
    this.p2p = p2p;
    this.P2PController = new P2PController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.get('/get-peers', p2pMiddleWare(this.p2p), this.P2PController.getPeers);
  }
}
