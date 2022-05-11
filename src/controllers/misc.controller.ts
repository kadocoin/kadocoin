/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */

import { Request, Response } from 'express';
import { addressValidation } from '../validation/misc.validation';
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SUCCESS,
  INCORRECT_VALIDATION,
} from '../statusCode/statusCode';
import { isValidChecksumAddress } from '../util/pubkey-to-address';

export default class MiscController {
  tokenLasts: string;

  addressInfo = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = addressValidation(req.params.address);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // CHECK THE VALIDITY OF ADDRESS
      if (!isValidChecksumAddress(req.params.address.trim()))
        return res.status(INCORRECT_VALIDATION).json({
          type: 'error',
          message: 'Invalid address.',
        });

      const address_bal = await req.leveldb.getValue(req.params.address, req.leveldb.balancesDB);

      return res.status(SUCCESS).json({
        type: 'success',
        message: address_bal,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  balance = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = addressValidation(req.body.address);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // CHECK THE VALIDITY OF ADDRESS
      if (!isValidChecksumAddress(req.body.address.trim()))
        return res.status(INCORRECT_VALIDATION).json({
          type: 'error',
          message: 'Invalid address.',
        });

      // GRAB NECESSARY MIDDLEWARE(S)
      const { leveldb } = req;

      const data = await leveldb.getBal(req.body.address);

      console.log('balance route', { message: data.message }); // REMOVE
      if (data.type == 'error')
        return res.status(NOT_FOUND).json({ type: 'error', message: data.message });

      return res.status(SUCCESS).json({
        balance: data.message,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };
}
