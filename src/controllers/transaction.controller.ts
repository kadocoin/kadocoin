/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
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
import sanitizeHTML from 'sanitize-html';
import Mining_Reward from '../util/supply_reward';

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
    let { amount, recipient, publicKey, address, message, sendFee } = req.body;

    // SANITIZE - REMOVE SCRIPTS/HTML TAGS
    amount = sanitizeHTML(amount, {
      allowedTags: [],
      allowedAttributes: {},
    });
    recipient = sanitizeHTML(recipient, {
      allowedTags: [],
      allowedAttributes: {},
    });
    publicKey = sanitizeHTML(publicKey, {
      allowedTags: [],
      allowedAttributes: {},
    });
    address = sanitizeHTML(address, {
      allowedTags: [],
      allowedAttributes: {},
    });
    message &&
      (message = sanitizeHTML(message, {
        allowedTags: [],
        allowedAttributes: {},
      }));
    sendFee &&
      (sendFee = sanitizeHTML(sendFee, {
        allowedTags: [],
        allowedAttributes: {},
      }));

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(recipient.trim()))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid recipient address.',
      });

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(address.trim()))
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

        console.log('instance of Transaction', transaction instanceof Transaction);

        transaction.update({
          publicKey,
          address,
          recipient,
          amount: Number(amount),
          balance,
          localWallet,
          message,
          sendFee,
        });
      } else {
        console.log('New transaction');
        transaction = localWallet.createTransaction({
          recipient,
          amount: Number(amount),
          chain: blockchain.chain,
          publicKey,
          address,
          message,
          sendFee,
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

  transactionPool = (req: Request, res: Response): Response | undefined => {
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
      const { error } = mineValidation(req.body);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      /**
       * @param address miner address
       * @param message miner message
       */
      let { address, message } = req.body;

      // SANITIZE - REMOVE SCRIPTS/HTML TAGS
      address = sanitizeHTML(address, {
        allowedTags: [],
        allowedAttributes: {},
      });
      message &&
        (message = sanitizeHTML(message, {
          allowedTags: [],
          allowedAttributes: {},
        }));

      // GRAB NECESSARY MIDDLEWARES
      const { transactionPool, blockchain, pubSub } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({
          blockchain: blockchain,
          transactionPool: transactionPool,
          address: address,
          pubSub: pubSub,
          message: message,
        });

        const status = transactionMiner.mineTransactions();

        // POOL CONTAINS INVALID TRANSACTIONS
        if (status !== 'success')
          return res.status(NOT_FOUND).json({ type: 'error', message: 'No valid transactions' });

        // UPDATE MINING_REWARD
        new Mining_Reward().calc({
          chainLength: blockchain.chain.length,
        });

        return res.status(SUCCESS).json({ type: 'success', message: 'Success' });
      }
      // NOTHING TO MINE
      return res.status(SUCCESS).json({ type: 'error', message: 'No transactions to mine' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };
}
