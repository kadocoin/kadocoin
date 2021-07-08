/*
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or http://www.opensource.org/licenses/mit-license.php.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { NOT_FOUND } from '../statusCode/statusCode';
import { JWTSECRET } from '../config/secret';

export function mustBeLoggedIn(req: Request, res: Response, next: NextFunction): void {
  try {
    jwt.verify(req.body.token, JWTSECRET);
    next();
  } catch (error) {
    res.status(NOT_FOUND).json('You are not logged in. Please log in to perform this operation.');
  }
}
