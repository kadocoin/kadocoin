import { NextFunction, Request, Response } from 'express';

export function blockchainMiddleWare(blockchain: any): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.blockchain = blockchain;
    next();
  };
}

export function transactionPoolMiddleWare(transactionPool: any): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.transactionPool = transactionPool;
    next();
  };
}

export function pubSubMiddleWare(pubSub: any): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.pubSub = pubSub;
    next();
  };
}

export function walletMiddleWare(localWallet: any): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.localWallet = localWallet;
    next();
  };
}
