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
import log_err_to_file from '../util/log-err-to-file';

export async function must_be_verified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<NextFunction | Response> {
  try {
    const commonModel = new CommonModel();

    /* CHECK REDIS FOR CACHED ENTRY FIRST */
    const cacheEntry: any = undefined;

    /* IF REDIS RETURNS A CACHE HIT */
    if (cacheEntry) {
      next();
      return;
    }

    /* IF REDIS RETURNS A CACHE MISS, MAKE A TRIP TO THE DATABASE */
    const { emailVerified } = await commonModel.findById(req.app.locals.db, req.body.user_id);

    if (!emailVerified) throw new Error(); // ERROR IS SENT TO CATCH BLOCK

    next();
  } catch (error) {
    log_err_to_file?.error(error);
    return res
      .status(NOT_FOUND)
      .json({ type: 'error', message: 'Email has not been verified. Please verify your email.' });
  }
}
