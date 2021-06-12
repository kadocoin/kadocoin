import { Request, Response } from 'express';
import { transactValidation } from '../validation/transaction.validation';
import { INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND, SUCCESS } from '../statusCode/statusCode';
import TransactionPool from '../wallet/transaction-pool';
import Wallet from '../wallet';
import Blockchain from '../blockchain';
import PubSub from '../pubSub';
import TransactionMiner from '../transactionMiner';

export class TransactionController {
  transactionPool: TransactionPool;
  wallet: Wallet;
  blockchain: Blockchain;
  pubsub: PubSub;

  constructor() {
    this.transactionPool = new TransactionPool();
    this.wallet = new Wallet();
    this.blockchain = new Blockchain();
    this.pubsub = new PubSub({ blockchain: this.blockchain, transactionPool: this.transactionPool });
  }

  make = (req: Request, res: Response) => {
    const { error } = transactValidation(req.body);
    const { amount, recipient } = req.body;

    if (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.details[0].message });
    }

    let transaction = this.transactionPool.existingTransactionPool({ inputAddress: this.wallet.publicKey });

    try {
      if (transaction) {
        transaction.update({ senderWallet: this.wallet, recipient, amount });
      } else {
        transaction = this.wallet.createTransaction({ recipient, amount, chain: this.blockchain.chain });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(NOT_FOUND).json({ type: 'error', message: error.message });
      }
    }

    this.transactionPool.setTransaction(transaction);

    this.pubsub.broadcastTransaction(transaction);

    return res.status(CREATED).json({ type: 'success', transaction });
  };

  poolMap = (_: Request, res: Response) => {
    try {
      return res.status(SUCCESS).json(this.transactionPool.transactionMap);
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  mine = (_: Request, res: Response) => {
    try {
      const transactionMiner = new TransactionMiner({ blockchain: this.blockchain, transactionPool: this.transactionPool, wallet: this.wallet, pubsub: this.pubsub });
      transactionMiner.mineTransactions();

      // TODO - COINS IN CIRCULATION
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };
}
