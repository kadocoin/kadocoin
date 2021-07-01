import { Db, MongoClient } from "mongodb";
import Blockchain from "./blockchain";
import Block from "./blockchain/block";
import PubSub from "./pubSub";
import Wallet from "./wallet";
import TransactionPool from "./wallet/transaction-pool";

interface IObjectKeys {
  [key: string]: string | number | Wallet;
}

export interface ICreateOutputParams extends IObjectKeys {
  publicKey?: string;
  address?: string;
  recipient?: string;
  amount?: number;
  balance?: string | number;
  localWallet?: Wallet;
}

type TOutput = { [key: string]: string | number } | ICreateOutputParams;

export interface IBaseInput {
  publicKey: string;
  address: string;
}

export interface IInput extends IBaseInput {
  timestamp: number;
  amount: string | number | undefined;
  localPublicKey: string;
  signature: string;
  balance?: string | number;
  output?: ICreateOutputParams;
  localWallet?: Wallet;
}

export interface IVerifySignatureProps {
  publicKey: string;
  data: any;
  signature: string;
}

export interface ICreateInputParams extends IBaseInput {
  balance?: string | number;
  output?: ICreateOutputParams;
  localWallet?: Wallet;
  localPublicKey?: string; // FOR TESTING PURPOSES
  amount?: string | number; // FOR TESTING PURPOSES
  signature?: string;
}

export interface ITransactionClassParams {
  recipient?: string;
  amount?: number;
  output?: ICreateOutputParams;
  input?: IInput;
  balance?: string;
  localWallet?: Wallet;
  publicKey?: string;
  address?: string;
}

export interface ITransactionParam {
  id: string;
  input: IInput;
  output: ICreateOutputParams;
}

export type TDataChild = {
  id: string;
  output: { [key: string]: string | number };
  input: IInput;
};

export type IChain = Array<Block>;

export interface IBlockProps {
  timestamp: number;
  lastHash: string;
  hash: string;
  data: Array<TDataChild>;
  nonce: number;
  difficulty: number;
}

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

export interface IOutput extends IObjectKeys {
  address: string;
  recipient: string;
}
