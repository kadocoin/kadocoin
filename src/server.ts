/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
// Copyright (c) Adamu Muhammad Dankore
import app from './app';
import { ENVIRONMENT, PORT } from './config/secret';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import UserRouter from './routes/user.router';
import TransactionRouter from './routes/transaction.router';
import Blockchain from './blockchain';
import TransactionPool from './wallet/transaction-pool';
import PubSub from './pubSub';
import Wallet from './wallet';
import { BlockRouter } from './routes/block.router';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';
import { Db, MongoClient } from 'mongodb';
import { MONGODB_URI, DB_NAME } from './config/secret';
import helmet from 'helmet';
import syncWithRootState from './util/syncWithRootState';
import P2P from './p2p';

/**
 * @var localWallet - signs and verifies transactions on this node
 */
const localWallet = new Wallet(); // USE FOR SIGNING / VERIFYING TRANSACTIONS
/**
 * @var blockchain app wide variable
 */
const blockchain = new Blockchain();
/**
 * @var transactionPool app wide variable
 */
const transactionPool = new TransactionPool();
/**
 * @var pubSub app wide variable
 */
const pubSub = new PubSub({ blockchain, transactionPool });

const initializeRoutes = (_: Request, __: Response, next: NextFunction) => {
  new UserRouter(app, blockchain);
  new BlockRouter(app, blockchain);
  new TransactionRouter(app, transactionPool, blockchain, pubSub, localWallet);
  next();
};

/** MIDDLEWARES */

app.use(function (_, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(initializeRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/** END MIDDLEWARES */

/**  OPEN MONGODB CONNECTED AND START APP  */
MongoClient.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async client => {
    app.locals.dbClient = client;
    app.locals.db = client.db(DB_NAME);

    // CREATE INDEX
    const createIndexes = async (db: Db): Promise<void> => {
      await Promise.all([
        db
          .collection('users')
          .createIndex({ email: 1, _id: 1, address: 1, publicKey: 1 }, { unique: true }),
      ]);
    };

    await createIndexes(app.locals.db);
    console.log('*****MongoDB is connected*****');

    new P2P();

    app.listen(PORT, async () => {
      await syncWithRootState({ blockchain, transactionPool });
      console.log(`****Application is running on ${PORT} in ${ENVIRONMENT}*****`);
    });
  })
  .catch(err => {
    throw new Error(err);
  });
