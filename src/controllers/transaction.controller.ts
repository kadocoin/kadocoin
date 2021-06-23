import { Request, Response } from 'express';
import { mineValidation, transactValidation } from '../validation/transaction.validation';
import { INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND, SUCCESS, INCORRECT_VALIDATION } from '../statusCode/statusCode';
import Wallet from '../wallet';
import TransactionMiner from '../transactionMiner';
import { CommonModel } from '../models/common.model';
import isEmptyObject from '../util/isEmptyObject';

export class TransactionController {
  commonModel: CommonModel;
  wallet: any;
  constructor() {
    this.commonModel = new CommonModel();
    this.wallet = new Wallet();
  }

  make = async (req: Request, res: Response) => {
    const { error } = transactValidation(req.body);
    if (error) return res.status(INCORRECT_VALIDATION).json({ type: 'error', message: error.details[0].message });

    let { amount, recipient, publicKey } = req.body;
    amount = Number(amount);
    const { transactionPool, blockchain, pubSub, localWallet } = req;

    let transaction = transactionPool.existingTransactionPool({ inputAddress: publicKey });
    const balance = Wallet.calculateBalance({ address: publicKey, chain: blockchain.chain });

    try {
      if (transaction) {
        console.log('Update transaction');
        transaction.update({ publicKey, recipient, amount, balance, localWallet });
      } else {
        console.log('New transaction');
        transaction = localWallet.createTransaction({ recipient, amount, chain: blockchain.chain, publicKey });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(NOT_FOUND).json({ type: 'error', message: error.message });
      }
    }

    transactionPool.setTransaction(transaction);

    pubSub.broadcastTransaction(transaction);

    return res.status(CREATED).json({ type: 'success', transaction });
  };

  poolMap = (req: Request, res: Response) => {
    try {
      const { transactionPool } = req;

      return res.status(SUCCESS).json(transactionPool.transactionMap);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  mine = async (req: Request, res: Response) => {
    try {
      const { error } = mineValidation(req.body.publicKey);
      if (error) return res.status(INCORRECT_VALIDATION).json({ type: 'error', message: error.details[0].message });

      const { publicKey } = req.body;
      const { transactionPool, blockchain, pubSub } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({ blockchain: blockchain, transactionPool: transactionPool, publicKey: publicKey, pubSub: pubSub });

        const status = transactionMiner.mineTransactions();

        if (status !== 'success') return res.status(NOT_FOUND).json({ type: 'error', message: 'No valid transactions' });

        return res.status(SUCCESS).json({ type: 'success', message: 'Success' });
      }

      res.status(SUCCESS).json({ type: 'error', message: 'No transactions to mine' });

      // TODO - COINS IN CIRCULATION
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  getBlocks = (req: Request, res: Response) => {
    try {
      return res.status(SUCCESS).json(req.blockchain.chain);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  getABlock = (req: Request, res: Response) => {
    try {
      const block = req.blockchain.chain.find((block: any) => block.hash === req.params.blockHash);

      if (!block) return res.status(NOT_FOUND).json('Not found');

      return res.status(SUCCESS).json(block);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };
}
