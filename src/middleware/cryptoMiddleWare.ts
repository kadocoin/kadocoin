import { NextFunction, Request, Response } from "express";
import Blockchain from "../blockchain";
import PubSub from "../pubSub";
import Wallet from "../wallet";
import TransactionPool from "../wallet/transaction-pool";

export function blockchainMiddleWare(blockchain: Blockchain): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.blockchain = blockchain;
    next();
  };
}

export function transactionPoolMiddleWare(
  transactionPool: TransactionPool
): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.transactionPool = transactionPool;
    next();
  };
}

export function pubSubMiddleWare(pubSub: PubSub): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.pubSub = pubSub;
    next();
  };
}

export function walletMiddleWare(localWallet: Wallet): any {
  return function (req: Request, _: Response, next: NextFunction) {
    req.localWallet = localWallet;
    next();
  };
}
