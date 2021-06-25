import { Db, MongoClient } from "mongodb";
import Blockchain from "./blockchain";
import PubSub from "./pubSub";
import Wallet from "./wallet";
import TransactionPool from "./wallet/transaction-pool";

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
  wallet?: Wallet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signature?: any;
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
