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
import { redisClientCaching } from '../config/redis';
import log_err_to_file from '../util/log_err_to_file';

export async function must_be_verified(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<NextFunction | Response> {
  try {
    console.log({ regBody: req.body });
    const commonModel = new CommonModel();

    /* CHECK REDIS FOR CACHED ENTRY FIRST */
    const cacheEntry = await redisClientCaching.get(`user:${req.body.user_id}`);
    console.log({ cacheEntry });

    /* IF REDIS RETURNS A CACHE HIT */
    if (cacheEntry) {
      next();
      return;
    }

    console.log('before db check');

    /* IF REDIS RETURNS A CACHE MISS, MAKE A TRIP TO THE DATABASE */
    const { emailVerified } = await commonModel.findById(req.db, req.body.user_id);
    console.log({ emailVerified });

    if (!emailVerified) throw new Error(); // ERROR IS SENT TO CATCH BLOCK

    /* ADD THE ENTRY TO REDIS FOR NEXT TIME AND SET AN EXPIRY OF ONE HOUR */
    redisClientCaching.set(`user:${req.body.user_id}`, 'true', 'EX', 3600);

    console.log('Yes it is verified');

    next();
  } catch (error) {
    log_err_to_file?.error(error);
    return res
      .status(NOT_FOUND)
      .json({ type: 'error', message: 'Email has not been verified. Please verify your email.' });
  }
}
