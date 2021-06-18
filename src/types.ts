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
}

declare global {
  namespace Express {
    interface Request {
      dbClient: any;
      db: Db;
      blockchain: any;
    }
  }
}
