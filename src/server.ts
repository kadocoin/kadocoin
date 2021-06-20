import app from './app';
import request from 'request';
const expressSwagger = require('express-swagger-generator')(app);
import { DEFAULT_PORT, ENVIRONMENT, PORT, ROOT_NODE_ADDRESS } from './util/secret';
import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import { UserRouter } from './routes/userRouter.router';
import { ExpressMiddleWares } from './middleware/expressMiddlewares';
import { TransactionRouter } from './routes/transactionRouter.router';
import { Database } from './middleware/database';
import Blockchain from './blockchain';
import TransactionPool from './wallet/transaction-pool';
import PubSub from './pubSub';
import TransactionMiner from './transactionMiner';

/**
 * APP GLOBAL VARIABLES RELATED TO BLOCKCHAIN
 */

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const pubSub = new PubSub({ blockchain, transactionPool });

let options = {
  swaggerDefinition: {
    info: {
      description: 'Kadocoin',
      title: 'Kadocoin',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: '',
      },
      value: 'Bearer <JWT>',
    },
  },
  basedir: __dirname, //app absolute path
  files: ['../src/routes/*.*.ts'], //Path to the API handle folder
};

expressSwagger(options);

let initializeRoute = (_: Request, __: Response, next: NextFunction) => {
  new UserRouter(app, blockchain);
  new TransactionRouter(app, transactionPool, blockchain, pubSub);
  next();
};

let initializeMiddleWare = (req: Request, res: Response, next: NextFunction) => {
  new ExpressMiddleWares(app);
  new Database(app);
  next();
};

const syncWithRootState = () => {
  request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body);

      console.log('replacing a chain on sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body);

      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  });
};

app.use(initializeMiddleWare);
app.use(initializeRoute);

app.listen(PORT, () => {
  if (PORT !== DEFAULT_PORT) syncWithRootState();
  console.log(`Application is running on ${PORT} in ${ENVIRONMENT}`);
});
