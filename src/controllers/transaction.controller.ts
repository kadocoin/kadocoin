/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Request, Response } from 'express';
import {
  mineValidation,
  sendValidation,
  transactValidation,
} from '../validation/transaction.validation';
import {
  INTERNAL_SERVER_ERROR,
  CREATED,
  NOT_FOUND,
  SUCCESS,
  INCORRECT_VALIDATION,
} from '../statusCode/statusCode';
import Wallet from '../wallet';
import TransactionMiner from '../transactionMiner';
import isEmptyObject from '../util/is-empty-object';
import { isValidChecksumAddress } from '../util/pubkey-to-address';
import Transaction from '../wallet/transaction';
import sanitizeHTML from 'sanitize-html';
import Mining_Reward from '../util/supply_reward';
import sanitize_html from '../util/sanitize-html';

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
    if (req.body.amount && !/^\d*\.?\d{1,8}$/.test(req.body.amount))
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
    amount = sanitize_html(amount);
    recipient = sanitize_html(recipient);
    publicKey = sanitize_html(publicKey);
    address = sanitize_html(address);
    message && (message = sanitize_html(message)); // OPTIONAL
    sendFee && (sendFee = sanitize_html(sendFee)); // OPTIONAL

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(recipient.trim()))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid recipient address.',
      });

    // CHECK THE VALIDITY OF SENDER ADDRESS
    if (!isValidChecksumAddress(address.trim()))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid sender address.',
      });

    // GRAB NECESSARY MIDDLEWARES
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { transactionPool, blockchain, p2p } = req;

    // RE-CREATE WALLET INSTANCE FROM KEYPAIRHEX
    const { keyPairHex } = req.app.locals.user;

    const localWallet = new Wallet(
      Wallet.calculateBalance({ chain: blockchain.chain, address }),
      Wallet.keyPairFromHex(keyPairHex),
      publicKey,
      address,
      keyPairHex
    );

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
        console.log('instance of Transaction', transaction instanceof Transaction);

        transaction.update({
          publicKey,
          address,
          recipient,
          amount: Number(amount),
          balance: localWallet.balance,
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

    /** SAVE TRANSACTION TO MEMORY */
    transactionPool.setTransaction(transaction);

    /** SEND TRANSACTION TO OTHER PEERS */
    p2p.sendTransactions(transaction);

    // TODO: SAVE TRANSACTION TO DB

    return res.status(CREATED).json({ type: 'success', transaction });
  };

  /**
   * Send Kadocoin
   *
   * @method send
   * @param {Request} req Express Request object
   * @param {Response} res Express Response object
   * @return a transaction object
   */
  send = async (req: Request, res: Response): Promise<Response> => {
    // ENFORCE 8 DECIMAL PLACES
    if (req.body.amount && !/^\d*\.?\d{1,8}$/.test(req.body.amount))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message:
          'You can only send up to eight(8) decimal places or 100 millionths of one Kadocoin',
      });

    // VALIDATE OTHER USER INPUTS
    const { error } = sendValidation(req.body);
    if (error)
      return res
        .status(INCORRECT_VALIDATION)
        .json({ type: 'error', message: error.details[0].message });

    // GRAB USER INPUTS
    let { amount, recipient, address, message, sendFee } = req.body;

    // SANITIZE - REMOVE SCRIPTS/HTML TAGS
    amount = sanitize_html(amount);
    recipient = sanitize_html(recipient);
    address = sanitize_html(address);
    message && (message = sanitize_html(message)); // OPTIONAL
    sendFee && (sendFee = sanitize_html(sendFee)); // OPTIONAL

    // CHECK THE VALIDITY OF RECIPIENT ADDRESS
    if (!isValidChecksumAddress(recipient.trim()))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid receiver address.',
      });

    // CHECK THE VALIDITY OF SENDER ADDRESS
    if (!isValidChecksumAddress(address.trim()))
      return res.status(INCORRECT_VALIDATION).json({
        type: 'error',
        message: 'Invalid sender address.',
      });

    // GRAB NECESSARY MIDDLEWARES
    const { transactionPool, blockchain, p2p, localWallet } = req;

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
          publicKey: transaction.input.publicKey,
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
          publicKey: localWallet.publicKey,
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

    /** SAVE TRANSACTION TO MEMORY */
    transactionPool.setTransaction(transaction);

    /** SEND TRANSACTION TO OTHER PEERS */
    p2p.sendTransactions(transaction);

    // TODO: SAVE TRANSACTION TO DB

    return res.status(CREATED).json({ type: 'success', transaction });
  };

  transactionPool = (req: Request, res: Response): Response | undefined => {
    try {
      const { transactionPool } = req;

      return res.status(SUCCESS).json({ type: 'success', message: transactionPool.transactionMap });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
    }
  };

  transaction = (req: Request, res: Response): Response => {
    try {
      const transaction = Object.values(req.transactionPool).find(
        transaction => transaction[req.params.id]?.id === req.params.id
      );

      if (!transaction)
        return res.status(NOT_FOUND).json({ type: 'error', message: 'Transaction not found' });

      return res.status(SUCCESS).json({ type: 'success', message: transaction });
    } catch (error) {
      if (error instanceof Error) {
        res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
        throw new Error(error.message);
      }
      throw new Error(error.message);
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
      const { transactionPool, blockchain, p2p, leveldb } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({
          blockchain: blockchain,
          transactionPool: transactionPool,
          address: address,
          p2p: p2p,
          leveldb,
          message: message,
        });

        const status = await transactionMiner.mineTransactions();

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
