import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { NOT_FOUND } from '../statusCode/statusCode';
import { JWTSECRET } from '../util/secret';

export function mustBeLoggedIn(req: Request, res: Response, next: NextFunction) {
  try {
    req.apiUser = jwt.verify(req.body.token, JWTSECRET);
    next();
  } catch (error) {
    res.status(NOT_FOUND).json('You are not logged in. Please log in to perform this operation.');
  }
}
