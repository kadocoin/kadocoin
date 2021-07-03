import { Request, Response } from 'express';
import { mineValidation, transactValidation } from '../validation/transaction.validation';
import {
  INTERNAL_SERVER_ERROR,
  CREATED,
  NOT_FOUND,
  SUCCESS,
  INCORRECT_VALIDATION,
} from '../statusCode/statusCode';
import Wallet from '../wallet';
import TransactionMiner from '../transactionMiner';
import isEmptyObject from '../util/isEmptyObject';
import { isValidChecksumAddress } from '../util/pubKeyToAddress';
import Transaction from '../wallet/transaction';

export default class TransactionController {
  /**
   * Send Kadocoin
   *
   * @method make
   * @param {Request} req Express Request object
   * @param {Response} res Express Response object
   * @return a transaction object
   */
  make = async (req: Request, res: Response): Promise<Response> => {
    // CHECK IF AMOUNT IS A NUMBER
    if (isNaN(Number(req.body.amount)))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Amount is not a number. Provide a number please.',
      });

    // ENFORCE 8 DECIMAL PLACES
    if (!/^\d*\.?\d{1,8}$/.test(req.body.amount))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message:
          'You can only send up to eight(8) decimal places or 100 millionths of one Kadocoin',
      });

    // VALIDATE OTHER USER INPUTS
    const { error } = transactValidation(req.body);
    if (error)
      return res
        .status(INCORRECT_VALIDATION)
        .json({ type: 'error', message: error.details[0].message });

    // GRAB USER INPUTS
    const { amount, recipient, publicKey, address } = req.body;

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(recipient))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid recipient address.',
      });

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(address))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid sender address.',
      });

    // GRAB NECESSARY MIDDLEWARES
    const { transactionPool, blockchain, pubSub, localWallet } = req;

    // ENFORCE SO THAT A USER CANNOT SEND KADOCOIN TO THEMSELVES
    if (recipient === address)
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Sender and receiver address cannot be the same.',
      });

    // CHECK FOR EXISTING TRANSACTION
    let transaction = transactionPool.existingTransactionPool({
      inputAddress: address,
    });

    try {
      if (transaction) {
        console.log('Update transaction');
        // GET UP TO DATE USER BALANCE
        const balance = Wallet.calculateBalance({
          address: address,
          chain: blockchain.chain,
        });

        if (transaction instanceof Transaction) {
          transaction.update({
            publicKey,
            address,
            recipient,
            amount: Number(amount),
            balance,
            localWallet,
          });
        }
      } else {
        console.log('New transaction');
        transaction = localWallet.createTransaction({
          recipient,
          amount: Number(amount),
          chain: blockchain.chain,
          publicKey,
          address,
        });
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

  poolMap = (req: Request, res: Response): Response | undefined => {
    try {
      const { transactionPool } = req;

      return res.status(SUCCESS).json(transactionPool.transactionMap);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  mine = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = mineValidation(req.body.address);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { address } = req.body;
      const { transactionPool, blockchain, pubSub } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({
          blockchain: blockchain,
          transactionPool: transactionPool,
          address: address,
          pubSub: pubSub,
        });

        const status = transactionMiner.mineTransactions();

        // POOL CONTAINS INVALID TRANSACTIONS
        if (status !== 'success')
          return res.status(NOT_FOUND).json({ type: 'error', message: 'No valid transactions' });

        return res.status(SUCCESS).json({ type: 'success', message: 'Success' });
      }

      return res.status(SUCCESS).json({ type: 'error', message: 'No transactions to mine' });

      // TODO - COINS IN CIRCULATION
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };
}
