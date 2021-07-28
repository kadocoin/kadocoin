/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Application } from 'express';
import Blockchain from '../blockchain';
import UserController from '../controllers/user.controller';
import { blockchainMiddleWare } from '../middleware/cryptoMiddleWare';
import { mustBeLoggedIn } from '../middleware/mustBeLoggedIn';
import multer from 'multer';
const upload = multer({ dest: '/tem' });

export default class UserRouter {
  private app: Application;
  private UserController: UserController;
  private blockchain: Blockchain;

  constructor(app: Application, blockchain: Blockchain) {
    this.app = app;
    this.blockchain = blockchain;
    this.UserController = new UserController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/doesEmailExists', this.UserController.doesEmailExists);

    this.app.post('/register', this.UserController.register);

    this.app.post(
      '/wallet-info',
      mustBeLoggedIn,
      blockchainMiddleWare(this.blockchain),
      this.UserController.walletInfo
    );

    this.app.post('/login', this.UserController.login);
    this.app.put(
      '/editProfileInfo',
      /** mustBeLoggedIn,*/
      upload.single('profilePicture'),
      this.UserController.editProfileInfo
    );
    this.app.post('/change_password', /** mustBeLoggedIn,*/ this.UserController.change_password);
  }
}
