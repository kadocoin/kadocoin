import { Application, Request, Response } from 'express';
import { DEFAULT_MESSAGE } from '../config/constants';
import { UserController } from '../controllers/user.controller';
import { BaseRouter } from './common/baseRouter.router';

export class UserRouter implements BaseRouter {
  private app: Application;
  private UserController: UserController;

  constructor(app: Application) {
    this.app = app;

    this.UserController = new UserController();
    this.initRoute();
  }

  initRoute(): void {
    this.app.get('/', (req: Request, res: Response) => {
    
      res.send(DEFAULT_MESSAGE);
    });

    this.app.post('/api/doesEmailExists', this.UserController.doesEmailExists);

    this.app.post('/api/register', this.UserController.register);

    /**
     * @typedef Login
     * @property {string} email.required - Some description for Login
     * @property {string} password.required - Some description for Login
     */

    /**
     * @typedef Error
     * @property {string} code.required
     */

    /**
     * This function comment is parsed by doctrine
     * @route POST /login
     * @group Login - Operations about user
     * @param {Login.model} Post.body.required - the new point
     * @operationId retrieveUserInfo
     * @produces application/json application/xml
     * @consumes application/json application/xml
     * @returns {Response.model} 201 - An array of user info
     * @returns {Login.model}  default - Unexpected error
     */

    // this.app.post("/login", this.UserController.login);
  }
}
