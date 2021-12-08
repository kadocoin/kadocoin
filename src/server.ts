/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
// Copyright (c) Adamu Muhammad Dankore

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import P2PModule from 'p2p';
import app from './app';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import UserRouter from './routes/user.router';
import TransactionRouter from './routes/transaction.router';
import Blockchain from './blockchain';
import TransactionPool from './wallet/transaction-pool';
import Wallet from './wallet';
import { BlockRouter } from './routes/block.router';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';
import { Db, MongoClient } from 'mongodb';
import { MONGODB_URI, DB_NAME, PORT, ENVIRONMENT } from './config/secret';
import helmet from 'helmet';
import P2P from './p2p';
import P2PRouter from './routes/p2p.router';
import { hardCodedPeers } from './config/constants';
import syncWithRootState from './util/syncWithRootState';

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
 * @var node_P2P app wide variable
 */

const node = P2PModule.peer({
  host: '127.0.0.1',
  port: 5346,
  wellKnownPeers: hardCodedPeers,
});

console.log(node);

const p2p = new P2P({ blockchain, transactionPool, node });

const initializeRoutes = (_: Request, __: Response, next: NextFunction) => {
  new UserRouter(app, blockchain);
  new BlockRouter(app, blockchain);
  new P2PRouter(app, p2p);
  new TransactionRouter(app, transactionPool, blockchain, p2p, localWallet);
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

    /** CREATE INDEX */
    const createIndexes = async (db: Db): Promise<void> => {
      await Promise.all([
        db
          .collection('users')
          .createIndex({ email: 1, _id: 1, address: 1, publicKey: 1 }, { unique: true }),
      ]);
    };

    await createIndexes(app.locals.db);
    console.log('*****MongoDB is connected*****');

    /** GET BLOCKCHAIN DATA FROM PEERS */
    await syncWithRootState({ blockchain, transactionPool });

    app.listen(PORT, async () => {
      console.log(`****Application is running on ${PORT} in ${ENVIRONMENT}*****`);
    });
  })
  .catch(err => {
    throw new Error(err);
  });
