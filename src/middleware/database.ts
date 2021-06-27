import { Db, MongoClient } from "mongodb";
import { Application, Request, Response, NextFunction } from "express";
import { MONGODB_URI, DB_NAME } from "../config/secret";

const customGlobal: any = global;
customGlobal.mongo = customGlobal.mongo || {};

export default class Database {
  private app: Application;
  private indexesCreated: boolean;

  constructor(app: Application) {
    this.app = app;
    this.app.use(this.openMongo);
    this.indexesCreated = false;
  }

  openMongo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!customGlobal.mongo.client) {
      customGlobal.mongo.client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await customGlobal.mongo.client.connect();
    }
    req.dbClient = customGlobal.mongo.client;
    req.db = customGlobal.mongo.client.db(DB_NAME);

    if (!this.indexesCreated) await this.createIndexes(req.db as Db);

    return next();
  };

  createIndexes = async (db: Db): Promise<void> => {
    await Promise.all([
      db
        .collection("tokens")
        .createIndex({ expireAt: -1 }, { expireAfterSeconds: 0 }),
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
    ]);
    this.indexesCreated = true;
  };
}
