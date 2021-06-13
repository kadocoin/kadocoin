import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { SUCCESS, DELETED, UPDATED, CREATED, INTERNAL_SERVER_ERROR } from '../statusCode/statusCode';
import { registerValidation } from '../validation/user.validation';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
}
