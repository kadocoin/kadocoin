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

export default class BlockController {
  getBlocks = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = blocksRouteValidation(req.query);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });
      console.log(
        Number(req.query.start),
        Number(req.query.end),
        !isNaN(8),
        isNaN(Number(req.query.start))
      );

      const chain = await new Promise(async resolve =>
        resolve(await req.leveldb.getBlocks(req.query.start as string, req.query.end as string))
      );

      return res.status(SUCCESS).json({ type: 'success', message: chain });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  getABlock = (req: Request, res: Response): Response => {
    try {
      const block = req.blockchain.chain.find(
        (block: Block) => block.hash === req.params.blockHash
      );

      if (!block) return res.status(NOT_FOUND).json('Block not found');

      return res.status(SUCCESS).json(block);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
        throw new Error(error.message);
      }
      throw new Error(error.message);
    }
  };
}
