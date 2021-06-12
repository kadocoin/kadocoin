import { Request, Response } from 'express';
import { transactValidation } from '../validation/transaction.validation';
import { INTERNAL_SERVER_ERROR, CREATED, NOT_FOUND } from '../statusCode/statusCode';
import TransactionPool from '../wallet/transaction-pool';
import Wallet from '../wallet';
import Blockchain from '../blockchain';
import PubSub from '../pubSub';

export class TransactController {
  make = async (req: Request, res: Response) => {
    console.log(req.body);
    const { error } = transactValidation(req.body);
    const { amount, recipient } = req.body;

    if (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });
    }

    const transactionPool = new TransactionPool();
    const wallet = new Wallet();
    const blockchain = new Blockchain();
    const pubsub = new PubSub({ blockchain, transactionPool });

    let transaction = transactionPool.existingTransactionPool({ inputAddress: wallet.publicKey });

    try {
      if (transaction) {
        transaction.update({ senderWallet: wallet, recipient, amount });
      } else {
        transaction = wallet.createTransaction({ recipient, amount, chain: blockchain.chain });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(NOT_FOUND).json({ type: 'error', message: error.message });
      }
    }

    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction(transaction);

    return res.status(CREATED).json({ type: 'success', transaction });
  };
}
