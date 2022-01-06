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
import express, { Request, Response, NextFunction } from 'express';
import MiscRouter from './routes/misc.router';
import TransactionRouter from './routes/transaction.router';
import Blockchain from './blockchain';
import TransactionPool from './wallet/transaction-pool';
import Wallet from './wallet';
import { BlockRouter } from './routes/block.router';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';
import P2P from './p2p';
import P2PRouter from './routes/p2p.router';
import { ENVIRONMENT, P2P_PORT, PORT } from './settings';
import restartServer from './util/restart-server';
import logger from './util/logger';
import address from './util/get-ip-address';
import LevelDB from './db';
import { EventEmitter } from 'events';
import isEmptyObject from './util/is-empty-object';
import { IHost } from './types';

const eventEmitter = new EventEmitter();

/**
 * @var leveldb app wide variable
 */
const leveldb = new LevelDB(eventEmitter);

leveldb.openDBs().then(async is_open => {
  if (!is_open) return logger.fatal('Error opening balancesdb');

  // setInterval(() => leveldb.getAllKeysAndValues(leveldb.balancesDB), 15000);

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
  const blockchain = new Blockchain({ leveldb });

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
  });

  const p2p = new P2P({ blockchain, transactionPool, peer, ip_address, leveldb });

  /************************************
   * GET BLOCKCHAIN DATA FROM PEERS   *
   ************************************/

  // FAKE DATA
  // await leveldb.onStartSeedFakeBlocks();

  // SAVE GENESIS BLOCK TO DB
  const has_saved_genesis = await leveldb.onStartSaveGenesisBlockToDB(blockchain.chain);

  // IF SAVING THE GENESIS BLOCK FAILED, RESTART
  if (!has_saved_genesis) {
    logger.warn('Saving the Genesis block failed');
    return restartServer();
  }

  // GET BEST HEIGHT OF EACH REMOTE PEER
  const remoteHeightsAndPeers = await p2p.onSynGetBestHeightsFromPeers();

  // IF NO PEER RESPONDS, RESTART
  if (isEmptyObject(remoteHeightsAndPeers)) {
    logger.warn('No peers responded during height discovery');
    return restartServer();
  }

  // THERE IS AT LEAST A PEER THAT RESPONDED...
  const peersAndHeights = await p2p.onSyncConstructHeadersAndPeers(remoteHeightsAndPeers);

  if (!isEmptyObject(peersAndHeights)) {
    // ...AND HAS MORE DATA THAN THIS PEER
    const has_downloaded_blks = await p2p.syncPeerWithHistoricalBlockchain(peersAndHeights);

    logger.info('Node sync status', { has_downloaded_blks });

    if (!has_downloaded_blks) {
      logger.fatal(
        'Kadocoin did not connect with other peers OR none of the peers have blockchain info to send.'
      );

      return restartServer();
    }

    // REPLACE WELLKNOWN PEERS WITH REMOTE PEERS THAT RESPONDED
    p2p.onSyncPopulateWellKnownPeers(peersAndHeights.peers as IHost[]);
  } else {
    // ...AND HAS SAME DATA WITH THIS PEER
    logger.info('This peer is up to date with blocks');
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
