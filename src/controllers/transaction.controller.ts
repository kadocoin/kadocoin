import { Request, Response } from 'express';
import { transactValidation } from '../validation/transaction.validation';
import { INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND, SUCCESS } from '../statusCode/statusCode';
import TransactionPool from '../wallet/transaction-pool';
import Wallet from '../wallet';
import Blockchain from '../blockchain';
import PubSub from '../pubSub';
import TransactionMiner from '../transactionMiner';
import { CommonModel } from '../models/common.model';
import Transaction from '../wallet/transaction';
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
    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.details[0].message });

    let { amount, recipient, address } = req.body;
    amount = Number(amount);
    const { transactionPool, blockchain, pubSub } = req;

    const userDoc = await this.commonModel.findByAddress(req.db, address);

    let transaction = transactionPool.existingTransactionPool({ inputAddress: userDoc.publicKey });
    const balance = Wallet.calculateBalance({ address: userDoc.publicKey, chain: blockchain.chain });

    try {
      if (transaction) {
        console.log('Update transaction');
        transaction.update({ userDoc, recipient, amount, balance });
      } else {
        console.log('New transaction');
        transaction = this.wallet.createTransaction({ recipient, amount, chain: blockchain.chain, senderAddress: userDoc.publicKey, userDoc });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(NOT_FOUND).json({ type: 'error', message: error.message });
      }
    }

    transactionPool.setTransaction(transaction);

    // pubsub.broadcastTransaction(transaction);

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
      const { publicKey } = req.body;
      const { transactionPool, blockchain, pubSub } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({ blockchain: blockchain, transactionPool: transactionPool, publicKey: publicKey, pubSub: pubSub });
        const userDoc = await this.commonModel.findWalletByPublicKey(req.db, publicKey);

        const status = transactionMiner.mineTransactions(userDoc);

        if (status !== 'success') {
          return res.status(NOT_FOUND).json({ type: 'error', message: 'No valid transactions' });
        }

        return res.status(SUCCESS).json({ type: 'success', message: 'Success' });
      }

      res.status(NOT_FOUND).json({ type: 'error', message: 'No transactions to mine' });

      // TODO - COINS IN CIRCULATION
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  // getBlocks = (_: Request, res: Response) => {
  //   try {
  //     return res.status(SUCCESS).json(this.blockchain.chain);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
  //     }
  //   }
  // };
}
