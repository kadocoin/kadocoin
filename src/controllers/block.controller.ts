import { Request, Response } from 'express';
import { INTERNAL_SERVER_ERROR, SUCCESS } from '../statusCode/statusCode';
import Blockchain from '../blockchain';



export class BlockController {
  blockchain: Blockchain;

  constructor() {
    this.blockchain = new Blockchain();
  }

  getBlocks = (_: Request, res: Response) => {
    try {
      return res.status(SUCCESS).json(this.blockchain.chain);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };
}
