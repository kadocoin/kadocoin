import app from './app';
const expressSwagger = require('express-swagger-generator')(app);
import { ENVIRONMENT, PORT } from './util/secret';
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

app.use(initializeMiddleWare);
app.use(initializeRoute);

app.listen(PORT, () => {
  console.log(`Application is running on ${PORT} in ${ENVIRONMENT}`);
});
