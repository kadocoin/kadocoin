import { Application } from 'express';
import { DEFAULT_MESSAGE } from '../config/constants';
import { UserController } from '../controllers/user.controller';
import { BaseRouter } from './common/baseRouter.router';

export class UserRoute implements BaseRouter {
  initRoute() {
    this.app.get('/', (req, res) => {
      // console.log(req.db);
      res.send(DEFAULT_MESSAGE);
    });
    /**
     * This function comment is parsed by doctrine
     * @route GET /users
     * @group User - Operations about user
     * @returns {object} 200 - An array of user info
     * @returns {Error}  default - Unexpected error
     */
    // this.app.get('/users', this.userController.findAll);
    /**
     * This function comment is parsed by doctrine
     * @route GET /users/{id}
     * @group User - Operations about user
     * @param {string} id.path.required
     * @returns {object} 200 - An array of user info
     * @returns {Error}  default - Unexpected error
     */
    // this.app.get('/users/:id', this.userController.findById);

    /**
     * @typedef User
     * @property {integer} id
     * @property {string} firstName.required - Some description for User
     * @property {string} lastName.required - Some description for User
     * @property {string} email - Some description for User
     */

    /**
     * @typedef Error
     * @property {string} code.required
     */

    /**
     * @typedef Response
     * @property {[integer]} code
     */

    /**
     * This function comment is parsed by doctrine
     * @route POST /users
     * @group User - Operations about user
     * @param {User.model} User.body.required - the new point
     * @operationId retrieveUserInfo
     * @produces application/json application/xml
     * @consumes application/json application/xml
     * @returns {Response.model} 201 - An array of user info
     * @returns {User.model}  default - Unexpected error
     */
    // this.app.post('/users', this.userController.save);
    /**
     * This function comment is parsed by doctrine
     * @route PUT /users/{id}
     * @group User - Operations about user
     * @param {string} id.path.required
     * @param {User.model} User.body.required - the new point
     * @operationId retrieveUserInfo
     * @produces application/json application/xml
     * @consumes application/json application/xml
     * @returns {Response.model} 201 - An array of user info
     * @returns {User.model}  default - Unexpected error
     */
    // this.app.put('/users/:id', this.userController.update);

    /**
     * This function comment is parsed by doctrine
     * @route DELETE /users/{id}
     * @group User - Operations about user
     * @param {string} id.path.required
     * @returns {object} 204 - An array of user info
     * @returns {Error}  default - Unexpected error
     */
    // this.app.delete('/users/:id', this.userController.delete);
  }

  private app: Application;
  private userController: UserController;

  constructor(app: Application) {
    this.app = app;
    this.userController = new UserController();
    this.initRoute();
  }
}
