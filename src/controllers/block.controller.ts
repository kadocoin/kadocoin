import { Request, Response } from "express";
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  SUCCESS,
} from "../statusCode/statusCode";
import Block from "../blockchain/block";

export class BlockController {
  getBlocks = (req: Request, res: Response): Response => {
    try {
      return res.status(SUCCESS).json(req.blockchain.chain);
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };

  getABlock = (req: Request, res: Response): Response => {
    try {
      const block = req.blockchain.chain.find(
        (block: Block) => block.hash === req.params.blockHash
      );

      if (!block) return res.status(NOT_FOUND).json("Block not found");

      return res.status(SUCCESS).json(block);
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };
}
