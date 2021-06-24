import { Request, Response } from "express";
import {
  mineValidation,
  transactValidation,
} from "../validation/transaction.validation";
import {
  INTERNAL_SERVER_ERROR,
  CREATED,
  NOT_FOUND,
  SUCCESS,
  INCORRECT_VALIDATION,
} from "../statusCode/statusCode";
import Wallet from "../wallet";
import TransactionMiner from "../transactionMiner";
import { CommonModel } from "../models/common.model";
import isEmptyObject from "../util/isEmptyObject";

export class TransactionController {
  commonModel: CommonModel;
  wallet: any;
  constructor() {
    this.commonModel = new CommonModel();
  }

  make = async (req: Request, res: Response) => {
    // CHECK IF AMOUNT IS A NUMBER
    if (isNaN(Number(req.body.amount)))
      return res.status(INCORRECT_VALIDATION).json({
        type: "error",
        message: "Amount is not a number. Provide a number please.",
      });
    // ENFORCE 8 DECIMAL PLACES
    if (!/^\d*\.?\d{1,8}$/.test(req.body.amount))
      return res.status(INCORRECT_VALIDATION).json({
        type: "error",
        message:
          "You can only send up to eight(8) decimal places or 100 millionths of one Kadocoin",
      });
    // VALIDATE OTHER USER INPUTS
    const { error } = transactValidation(req.body);
    if (error)
      return res
        .status(INCORRECT_VALIDATION)
        .json({ type: "error", message: error.details[0].message });
    // GRAB USER INPUTS
    const { amount, recipient, publicKey } = req.body;
    // GRAB NECESSARY MIDDLEWARES
    const { transactionPool, blockchain, pubSub, localWallet } = req;
    // ENFORCE SO THAT A USER CANNOT SEND KADOCOIN TO THEMSELVES
    if (recipient === publicKey)
      return res.status(INCORRECT_VALIDATION).json({
        type: "error",
        message: "Sender and receiver address cannot be the same.",
      });
    // CHECK FOR EXISTING TRANSACTION
    let transaction = transactionPool.existingTransactionPool({
      inputAddress: publicKey,
    });
    // GET UP TO DATE USER BALANCE
    const balance = Wallet.calculateBalance({
      address: publicKey,
      chain: blockchain.chain,
    });

    try {
      if (transaction) {
        console.log("Update transaction");
        transaction.update({
          publicKey,
          recipient,
          amount: Number(amount),
          balance,
          localWallet,
        });
      } else {
        console.log("New transaction");
        transaction = localWallet.createTransaction({
          recipient,
          amount: Number(amount),
          chain: blockchain.chain,
          publicKey,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res
          .status(NOT_FOUND)
          .json({ type: "error", message: error.message });
      }
    }

    transactionPool.setTransaction(transaction);

    pubSub.broadcastTransaction(transaction);

    return res.status(CREATED).json({ type: "success", transaction });
  };

  poolMap = (req: Request, res: Response) => {
    try {
      const { transactionPool } = req;

      return res.status(SUCCESS).json(transactionPool.transactionMap);
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };

  mine = async (req: Request, res: Response) => {
    try {
      const { error } = mineValidation(req.body.publicKey);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: "error", message: error.details[0].message });

      const { publicKey } = req.body;
      const { transactionPool, blockchain, pubSub } = req;

      if (!isEmptyObject(transactionPool.transactionMap)) {
        const transactionMiner = new TransactionMiner({
          blockchain: blockchain,
          transactionPool: transactionPool,
          publicKey: publicKey,
          pubSub: pubSub,
        });

        const status = transactionMiner.mineTransactions();

        if (status !== "success")
          return res
            .status(NOT_FOUND)
            .json({ type: "error", message: "No valid transactions" });

        return res
          .status(SUCCESS)
          .json({ type: "success", message: "Success" });
      }

      res
        .status(SUCCESS)
        .json({ type: "error", message: "No transactions to mine" });

      // TODO - COINS IN CIRCULATION
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };

  getBlocks = (req: Request, res: Response) => {
    try {
      return res.status(SUCCESS).json(req.blockchain.chain);
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };

  getABlock = (req: Request, res: Response) => {
    try {
      const block = req.blockchain.chain.find(
        (block: any) => block.hash === req.params.blockHash
      );

      if (!block) return res.status(NOT_FOUND).json("Not found");

      return res.status(SUCCESS).json(block);
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ type: "error", message: error.message });
      }
    }
  };
}
