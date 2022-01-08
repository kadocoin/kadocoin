/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Request, Response } from 'express';
import {
  INCORRECT_VALIDATION,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SUCCESS,
} from '../statusCode/statusCode';
import Block from '../blockchain/block';
import { blocksRouteValidation } from '../validation/block.validation';
import isEmptyObject from '../util/is-empty-object';

export default class BlockController {
  getBlocksByRange = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = blocksRouteValidation(req.query);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // NO VALIDATIONS ERROR - QUERY PARAMS ARE EITHER EMPTY STRINGS OR NUMBER IN STRING FORM
      const start = req.query.start ? Number(req.query.start) : undefined;
      const end = req.query.end ? Number(req.query.end) : undefined;

      const chain = await new Promise(async resolve =>
        resolve(await req.leveldb.getBlocksByRange(start, end))
      );

      return res.status(SUCCESS).json({ type: 'success', message: chain });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  getBlockByHash = async (req: Request, res: Response): Promise<Response> => {
    try {
      // USE THE HASH TO FIND THE BLOCK IN THE BLOCKS INDEX DB
      const response = await req.leveldb.getValue(req.params.blockHash, req.leveldb.blocksIndexDB);

      // IF THE BLOCK IS NOT FOUND, RETURN NOT FOUND
      if (isEmptyObject(response.message))
        return res.status(NOT_FOUND).json({ type: 'error', message: 'Block not found' });

      // IF THE BLOCK INDEX IS FOUND USE IT TO FIND THE BLOCK IN THE BLOCKS DB
      const block = await req.leveldb.getValue(
        `${response.message.blockchainHeight}`,
        req.leveldb.blocksDB
      );

      // IF THE BLOCK IS NOT FOUND, RETURN NOT FOUND
      if (!block) return res.status(NOT_FOUND).json({ type: 'error', message: 'Block not found' });

      return res.status(SUCCESS).json(block);
    } catch (err) {
      res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: err.message });
    }
  };
}
