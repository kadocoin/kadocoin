/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { NextFunction, Request, Response } from 'express';
import Blockchain from '../blockchain';
import PubSub from '../pubSub';
import Wallet from '../wallet';
import TransactionPool from '../wallet/transaction-pool';

type TReturnType = (req: Request, _: Response, next: NextFunction) => void;

export function blockchainMiddleWare(blockchain: Blockchain): TReturnType {
  return function (req: Request, _: Response, next: NextFunction) {
    req.blockchain = blockchain;
    next();
  };
}

export function transactionPoolMiddleWare(transactionPool: TransactionPool): TReturnType {
  return function (req: Request, _: Response, next: NextFunction) {
    req.transactionPool = transactionPool;
    next();
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function pubSubMiddleWare(p2p: any): TReturnType {
  return function (req: Request, _: Response, next: NextFunction) {
    req.p2p = p2p;
    next();
  };
}

export function walletMiddleWare(localWallet: Wallet): TReturnType {
  return function (req: Request, _: Response, next: NextFunction) {
    req.localWallet = localWallet;
    next();
  };
}
