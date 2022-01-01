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
import MiscRouter from './routes/misc.router';
import TransactionRouter from './routes/transaction.router';
import Blockchain from './blockchain';
import TransactionPool from './wallet/transaction-pool';
import Wallet from './wallet';
import { BlockRouter } from './routes/block.router';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';
import { PORT, ENVIRONMENT } from './config/secret';
import P2P from './p2p';
import P2PRouter from './routes/p2p.router';
import { hardCodedPeers, P2P_PORT } from './config/constants';
import restartServer from './util/restart-server';
import logger from './util/logger';
import address from './util/get-ip-address';
import LevelDB from './db';
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

/**
 * @var leveldb app wide variable
 */
const leveldb = new LevelDB(eventEmitter);

leveldb.balancesDB.open(async (err: any) => {
  if (err) return logger.fatal('Error opening balancesdb,', { err });

  setInterval(() => leveldb.getAllKeysAndValues(), 15000);

  logger.info('*****BalancesDB opened*****');

  /**
   * @var localWallet - signs and verifies transactions on this node
   */

  const localWallet = await new Wallet().loadWalletsFromFileOrCreateNew(leveldb);

  if (!(localWallet instanceof Wallet)) {
    logger.fatal('Wallet not properly loaded', { localWallet });
    return restartServer();
  }

  /**
   * @var blockchain app wide variable
   */
  const blockchain = await new Blockchain().loadBlocksFromFileOrCreateNew();

  /**
   * @var transactionPool app wide variable
   */
  const transactionPool = new TransactionPool();

  /**
   * @ip_address ip_address app wide variable
   */
  const ip_address = await address();

  logger.info('This peer IP address', { ip_address });

  /**
   * @var node_P2P app wide variable
   */
  const peer = P2PModule.peer({
    host: '127.0.0.1',
    port: P2P_PORT,
    metadata: { host: ip_address, port: P2P_PORT, type: 'full_node' },
    wellKnownPeers: hardCodedPeers,
  });

  const p2p = new P2P({ blockchain, transactionPool, peer, ip_address, leveldb });

  /** GET BLOCKCHAIN DATA FROM PEERS */
  const has_downloaded_txs_and_blks = await p2p.loopAndRunPeers(hardCodedPeers);

  logger.info('Node sync status', { has_downloaded_txs_and_blks });

  if (!has_downloaded_txs_and_blks[0] || !has_downloaded_txs_and_blks[1]) {
    logger.fatal(
      'Kadocoin did not connect with other peers OR none of the peers have blockchain info to send.'
    );
    return restartServer();
  }

  const initializeRoutes = (_: Request, __: Response, next: NextFunction) => {
    new MiscRouter(app, blockchain, leveldb);
    new BlockRouter(app, blockchain);
    new P2PRouter(app, p2p);
    new TransactionRouter(app, transactionPool, blockchain, p2p, localWallet, leveldb);
    next();
  };

  /** MIDDLEWARES */

  app.use(function (_, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(initializeRoutes);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  /** END MIDDLEWARES */

  app
    .listen(PORT, async () => {
      logger.info(`****Application is running on ${PORT} in ${ENVIRONMENT}*****`);
    })
    .on('error', err => logger.error(`${err}`));
});
