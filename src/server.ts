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
import plexus from '@nephys/plexus';
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
import EventsEmitter from 'events';

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
 * @var kadocoin_events app wide variable
 */
const kadocoin_events = new EventsEmitter();

/**
 * @var node_P2P app wide variable
 */
const node = new plexus.Node({ host: '127.0.0.1', port: 5346 });

// GET P2P NODE READY ANYTHING ELSE
node.on('ready', () => {
  const p2p = new P2P({ blockchain, transactionPool, kadocoin_events, node });

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

      // await p2p.syncNodeWithHistoricalBlockchain();

      await new Promise(resolve => setTimeout(resolve, 5000));

      app.listen(PORT, async () => {
        console.log(`****Application is running on ${PORT} in ${ENVIRONMENT}*****`);

        console.log({ listenersC: kadocoin_events.listenerCount('connected') });
        console.log({ listenersF: kadocoin_events.listenerCount('found') });
        console.log({ listenersB: kadocoin_events.listenerCount('broadcast') });

        // REMOVE ALL `CONNECTED` EVENTS
        node.removeAllListeners('connected');
        node.removeAllListeners('found');
      });
    })
    .catch(err => {
      throw new Error(err);
    });
});
