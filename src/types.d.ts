import { Db, MongoClient } from "mongodb";
import Blockchain from "./blockchain";
import Block from "./blockchain/block";
import PubSub from "./pubSub";
import Wallet from "./wallet";
import TransactionPool from "./wallet/transaction-pool";

interface ICreateOutputParams {
  publicKey?: string;
  address?: string;
  recipient?: string;
  amount?: number;
  balance?: string | number;
  localWallet?: Wallet;
}

type TOutput = { recipient?: string; address?: string };

interface IBaseInput {
  publicKey: string;
  address: string;
}

interface IInput extends IBaseInput {
  timestamp: number;
  amount: number;
  localPublicKey: string;
  signature: string;
  balance?: string | number;
  output?: any;
  localWallet?: Wallet;
}

interface ICreateInputParams extends IBaseInput {
  balance?: string | number;
  output?: ICreateOutputParams;
  localWallet?: Wallet;
}

interface ITransactionClassParams {
  recipient?: string;
  amount?: number;
  output?: ICreateOutputParams;
  input?: IInput;
  balance?: number | string;
  localWallet?: Wallet;
  publicKey?: string;
  address?: string;
}

type TDataChild = {
  id: string;
  output: { [key: string]: string };
  input: IInput;
};

// {
//                 "id": "4f5854f0-d6d1-11eb-9c97-a34ff152b317",
//                 "output": {
//                     "0x86045b56bfeb1A35C6818081130BA0F789dc27c9": "935.00000000",
//                     "0xf13C09968D48271991018A956C49940c41eCb1c3": "65.00000000"
//                 },
//                 "input": {
//                     "timestamp": 1624748003263,
//                     "amount": "1000.00000000",
//                     "address": "0x86045b56bfeb1A35C6818081130BA0F789dc27c9",
//                     "publicKey": "0460eeaa6a2393801ca90356bab01b6d206b9a431d8475f3ebff6999eef7199ad0b0f98e2aa354b24386b072553071dfe100574667584c11b518ea1e36ba959bb4",
//                     "localPublicKey": "0434c97b1353ea35a2ecdafad7810e71b7e23496a2dcfbf478a03aa90673770203a3c32ce77d1fe1d941cb31cc8dfb4681119063da8740ffe95d0e411d17a2cd33",
//                     "signature": {
//                         "r": "8e3a5c1d1b790f3b169a8f1ea202a9eac24fee3a42430da7afaf7f3b1244073",
//                         "s": "f4b64d5e277071fbcaf9e480e2799d80c4668eb73f1493cf8f30053079e9d462",
//                         "recoveryParam": 1
//                     }
//                 }
//             },

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
