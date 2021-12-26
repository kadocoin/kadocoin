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
import { blockchainMiddleWare, leveldbMiddleWare } from '../middleware/cryptoMiddleWare';
import { mustBeLoggedIn } from '../middleware/mustBeLoggedIn';
import multer from 'multer';
import { must_be_verified } from '../middleware/must_be_verified';
import LevelDB from '../db';
const upload = multer({ dest: 'app/dist/temp' });

export default class UserRouter {
  private app: Application;
  private UserController: UserController;
  private blockchain: Blockchain;
  private leveldb: LevelDB;

  constructor(app: Application, blockchain: Blockchain, leveldb: LevelDB) {
    this.app = app;
    this.blockchain = blockchain;
    this.leveldb = leveldb;
    this.UserController = new UserController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.post('/doesEmailExists', this.UserController.doesEmailExists);

    this.app.post('/register', this.UserController.register);

    this.app.get(
      '/address/:address',
      blockchainMiddleWare(this.blockchain),
      this.UserController.addressInfo
    );

    this.app.post('/balance', leveldbMiddleWare(this.leveldb), this.UserController.balance);

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
    this.app.post(
      '/send-verification-email',
      mustBeLoggedIn,
      this.UserController.send_verification_email
    );
    this.app.post('/verify-registration-email', this.UserController.verify_registration_email);
    this.app.post('/forgot-password-step-1', this.UserController.forgot_password_step_1);
    this.app.post('/verify-reset-password-token', this.UserController.check_reset_password_token);
    this.app.post('/forgot-password-step-2', this.UserController.forgot_password_step_2);
    this.app.post('/subscribe-to-newsletter', this.UserController.subscribe_to_newsletter);
    this.app.post('/contact-us', this.UserController.contact_us);
  }
}
