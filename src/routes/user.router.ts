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
import { must_be_verified } from '../middleware/must_be_verified';
const upload = multer({ dest: '/app/dist/temp' });

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
      '/edit-profile-info',
      upload.single('profilePicture'),
      must_be_verified,
      mustBeLoggedIn,
      this.UserController.editProfileInfo
    );
    this.app.post(
      '/change-password',
      must_be_verified,
      mustBeLoggedIn,
      this.UserController.change_password
    );
    this.app.post(
      '/delete-account',
      must_be_verified,
      mustBeLoggedIn,
      this.UserController.delete_account
    );
    this.app.post('/verify-email', mustBeLoggedIn, this.UserController.send_verification_email);
    this.app.post('/verify-token', this.UserController.verify_token);
    this.app.put('/forgot-password-step-1', this.UserController.forgot_password_step_1);
    this.app.post('/check-reset-password-token', this.UserController.check_reset_password_token);
  }
}
