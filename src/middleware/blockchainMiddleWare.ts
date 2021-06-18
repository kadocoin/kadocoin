import { NextFunction, Request, Response } from 'express';

export default function blockchainMiddleWare(blockchain: any): any {
  return function (req: Request, res: Response, next: NextFunction) {
    req.blockchain = blockchain;
    next();
  };
}
