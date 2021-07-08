/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
import { Application } from 'express';
import Blockchain from '../blockchain';
import UserController from '../controllers/user.controller';
import { blockchainMiddleWare } from '../middleware/cryptoMiddleWare';
import { mustBeLoggedIn } from '../middleware/mustBeLoggedIn';

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
    this.app.post('/api/doesEmailExists', this.UserController.doesEmailExists);

    /**
     * @swagger
     * /api/register:
     *  post:
     *    description: API for registering users
     *    tags:
     *     - Registration
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    parameters:
     *    - in: body
     *      name: Register API
     *      schema:
     *        $ref: '#/definitions/Register'
     *    responses:
     *        200:
     *            description: It's ok and user logged successfully
     *        400:
     *            description: It's bad request
     *        500:
     *            description: It's internal server error
     * definitions:
     *    Register:
     *        type: object
     *        required:
     *        - email
     *        - password
     *        properties:
     *            email:
     *                type: string
     *                example: user@example.com
     *            password:
     *                type: string
     *                example: your-password
     *
     *
     */
    this.app.post('/api/register', this.UserController.register);
    this.app.post(
      '/api/wallet-info',
      mustBeLoggedIn,
      blockchainMiddleWare(this.blockchain),
      this.UserController.walletInfo
    );

    /**
     * @swagger
     * /api/login:
     *  post:
     *    description: API for authenticating users
     *    tags:
     *     - Login
     *    consumes:
     *    - application/json
     *    produces:
     *    - application/json
     *    parameters:
     *    - in: body
     *      name: Login API
     *      schema:
     *        $ref: '#/definitions/Login'
     *    responses:
     *        200:
     *            description: It's ok and user logged successfully
     *        400:
     *            description: It's bad request
     *        500:
     *            description: It's internal server error
     * definitions:
     *    Login:
     *        type: object
     *        required:
     *        - email
     *        - password
     *        properties:
     *            email:
     *                type: string
     *                example: user@example.com
     *            password:
     *                type: string
     *                example: your-password
     *
     *
     */

    this.app.post('/api/login', this.UserController.login);
  }
}
