/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Request, Response, NextFunction } from 'express';
import { NOT_FOUND } from '../statusCode/statusCode';
import CommonModel from '../models/common.model';

export async function must_be_verified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<NextFunction | Response> {
  try {
    const commonModel = new CommonModel();

    const { emailVerified } = await commonModel.findById(req.db, req.body.user_id);

    if (!emailVerified) throw new Error(); // ERROR IS SENT TO CATCH BLOCK

    next();
  } catch (error) {
    return res
      .status(NOT_FOUND)
      .json({ type: 'error', message: 'Email has not been verified. Please verify your email.' });
  }
}
