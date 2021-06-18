import { Db, MongoClient } from 'mongodb';
import { Application, Request, Response, NextFunction, request } from 'express';


const customGlobal: any = global;
customGlobal.mongo = customGlobal.mongo || {};

export class Database {
  private app: Application;
  indexesCreated: boolean;

  constructor(app: Application) {
    this.app = app;
    this.app.use(this.openMongo);
    this.indexesCreated = false;
  }

  openMongo = async (req: Request, res: Response, next: NextFunction) => {
    if (!customGlobal.mongo.client) {
      customGlobal.mongo.client = new MongoClient(process.env.MONGODB_URI!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await customGlobal.mongo.client.connect();
    }
    req.dbClient = customGlobal.mongo.client;
    req.db = customGlobal.mongo.client.db(process.env.DB_NAME);

    if (!this.indexesCreated) await this.createIndexes(req.db as Db);

    console.log('MongoDb connected!');

    return next();
  };

  createIndexes = async (db: Db) => {
    await Promise.all([db.collection('tokens').createIndex({ expireAt: -1 }, { expireAfterSeconds: 0 }), db.collection('users').createIndex({ email: 1 }, { unique: true })]);
    this.indexesCreated = true;
  };
}
