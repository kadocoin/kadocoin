import { Db } from "mongodb";

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
  wallet?: any;
  signature?: any;
}

declare global {
  namespace Express {
    interface Request {
      dbClient: any;
      db: Db;
      blockchain: any;
      wallet: any;
      transactionPool: any;
      pubSub: any;
      apiUser: any;
      localWallet: any;
    }
  }
}
