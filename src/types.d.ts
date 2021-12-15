/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { Db, MongoClient } from 'mongodb';
import Blockchain from './blockchain';
import Block from './blockchain/block';
import P2P from './p2p';
import Wallet from './wallet';
import Transaction from './wallet/transaction';
import TransactionPool from './wallet/transaction-pool';

export interface IWalletParam {
  balance?: string;
  keyPair?: any;
  publicKey?: string;
  address?: string;
  keyPairHex?: string;
}

export interface IWalletFormattedForStorage {
  publicKey: string;
  address: string;
  keyPairHex: string;
}
export interface IHost {
  host: string;
  port: number;
}

export interface ITMinerConstructorParams {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  p2p: P2P;
  address: string;
  message: string;
}

/**
 * INPUT types
 * @param Transaction
 */

export interface IInput {
  publicKey: string;
  address: string;
  timestamp: number;
  amount: string;
  sendFee?: string;
  signature: string;
}

/** verifySignature() PARAM types
 * @function verifySignature
 */
export interface IVerifySignatureProps {
  publicKey: string;
  transactions: Array<Transaction>;
  signature: string;
}

export type TTransactions = Array<Transaction>;

/**
 * Signature type for the Data children
 * The Data Array holds all the transactions of the block
 */
export type TTransactionChild = {
  id: string;
  output: { [key: string]: string };
  input: IInput;
};

export type IChain = Array<Block>;

export interface IUserModel {
  _id?: string;
  emailVerified?: boolean;
  profilePicture?: string;
  userCreationDate?: string;
  email?: string;
  password?: string;
  name?: string;
  bio?: string;
  scope?: string[];
  registrationMethod?: string;
  hashedPassword?: string;
  publicKey?: string;
  address?: string;
  token?: string;
  keyPairHex?: string;
}

declare global {
  namespace Express {
    interface Request {
      dbClient: MongoClient;
      db: Db;
      blockchain: Blockchain;
      wallet: Wallet;
      transactionPool: TransactionPool;
      p2p: P2P;
      localWallet: Wallet;
    }
  }
}

/** Transaction() PARAM types
 * @class Transaction
 */
export interface ITransaction {
  publicKey?: string;
  address?: string;
  recipient?: string;
  amount?: number;
  output?: ICOutput_R;
  input?: ICInput_R;
  balance?: string;
  localWallet?: Wallet;
  message?: string;
  sendFee?: string;
  id?: string;
}

/** COMMON TYPES createInput() */
interface ICommon_Address_PublicKey {
  address: string;
  // publicKey: string;
}
/** createInput() PARAM type */
export interface ICInput extends ICommon_Address_PublicKey {
  balance: string;
  localWallet: Wallet;
  output: ICOutput_R;
  message?: string;
  sendFee?: string;
}
/** createInput() RETURN type  */
export interface ICInput_R extends ICommon_Address_PublicKey {
  timestamp: number;
  amount: string;
  publicKey: string;
  signature: string;
  sendFee?: string;
  recipient?: string;
}

/** createOutput() PARAM type */
export interface ICOutput {
  address: string;
  recipient: string;
  amount: number;
  balance: string;
  sendFee?: string;
}
/** createOutput() RETURN type  */
export interface ICOutput_R {
  [key: string]: string;
}

/** update() PARAMS type  */
export interface IUpdate {
  publicKey: string;
  address: string;
  recipient: string;
  amount: number;
  balance: string;
  message?: string;
  sendFee?: string;
  localWallet: Wallet;
}

export interface ICreateTransactionParams {
  recipient: string;
  amount: number;
  chain?: IChain;
  publicKey?: string;
  address?: string;
  message?: string;
  sendFee?: string;
}

export interface REWARD_INPUT {
  timestamp: number;
  amount: string;
  address: string;
  publicKey: string;
  recipient: string;
  signature: string;
  message?: string;
}

export interface incomingObj {
  block: Block;
  info: {
    KADOCOIN_VERSION: string;
    LOCAL_IP: string;
    height: number;
    sender: {
      host: string;
      port: number;
      id: string;
      timestamp: number;
    };
  };
}
