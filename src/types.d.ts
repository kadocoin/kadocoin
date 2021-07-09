import { Db, MongoClient } from 'mongodb';
import Blockchain from './blockchain';
import Block from './blockchain/block';
import PubSub from './pubSub';
import Wallet from './wallet';
import TransactionPool from './wallet/transaction-pool';

export interface ITMinerConstructorParams {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  pubSub: PubSub;
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
  localPublicKey: string;
  signature: string;
}

/** verifySignature() PARAM types
 * @function verifySignature
 */
export interface IVerifySignatureProps {
  publicKey: string;
  transactions: Array<TTransactionChild>;
  signature: string;
}

export type TTransactions = Array<TTransactionChild>;

/**
 * Signature type for the Data children
 * The Data Array holds all the transactions of the block
 */
export type TTransactionChild = {
  id: string;
  output: { [key: string]: string | number };
  input: IInput;
};

export type IChain = Array<Block>;

export interface IUserModel {
  _id?: string;
  emailVerified?: boolean;
  profilePicture?: null;
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
}

declare global {
  namespace Express {
    interface Request {
      dbClient: MongoClient;
      db: Db;
      blockchain: Blockchain;
      wallet: Wallet;
      transactionPool: TransactionPool;
      pubSub: PubSub;
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
}

/** COMMON TYPES createInput() */
interface ICommon_Address_PublicKey {
  address: string;
  publicKey: string;
  message?: string;
}
/** createInput() PARAM type */
export interface ICInput extends ICommon_Address_PublicKey {
  balance: string;
  localWallet: Wallet;
  output: ICOutput_R;
}
/** createInput() RETURN type  */
export interface ICInput_R extends ICommon_Address_PublicKey {
  timestamp: number;
  amount: string;
  localPublicKey: string;
  signature: string;
}

/** createOutput() PARAM type */
export interface ICOutput {
  address: string;
  recipient: string;
  amount: number;
  balance: string;
  message?: string;
}
/** createOutput() RETURN type  */
export interface ICOutput_R {
  [key: string]: string | number;
}

/** update() PARAMS type  */
export interface IUpdate {
  publicKey: string;
  address: string;
  recipient: string;
  amount: number;
  balance: string;
  localWallet: Wallet;
  message: string;
}

/**
 * SAMPLE OF A DATA ARRAY CHILD
 */
// {
//   "3a0b30c0-dac0-11eb-bd1f-9390feb6f0dc": {
//     "id": "3a0b30c0-dac0-11eb-bd1f-9390feb6f0dc",
//       "input": {
//       "timestamp": 1625180470732,
//         "amount": "1000.00000000",
//           "address": "0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD",
//             "publicKey": "0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4",
//               "localPublicKey": "0496daa6e7206304dfb696f0e5ebd96c0972dea3f0d0ba1ab78325777c2749db87b7b808df76f58696081002c58d28d9594f31330bd00c184763e8b3875ecf6727",
//                 "signature": {
//         "r": "c175c2fe33366f2e7a05d69f6bf6dfb5d7930a7ed0ed3cf33da878062e6979ce",
//           "s": "989d53ce3c6b65d3a8d7f975fcf72ee103d821871581f4e0354f858f3655d914",
//             "recoveryParam": 0
//       }
//     },
//     "output": {
//       "0xC6d23c6703f33F5ad74E6E4fc17C1CE9397D4AAD": "770.00000000",
//         "0x86045b56bfeb1A35C6818081130BA0F789dc27c9": "230.00000000"
//     }
//   }
// }
