import app from "./app";
import request from "request";
import expressSwagger from "express-swagger-generator";
import {
  DEFAULT_PORT,
  ENVIRONMENT,
  PORT,
  ROOT_NODE_ADDRESS,
} from "./config/secret";
import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import UserRouter from "./routes/userRouter.router";
import ExpressMiddleWares from "./middleware/expressMiddlewares";
import TransactionRouter from "./routes/transactionRouter.router";
import Database from "./middleware/database";
import Blockchain from "./blockchain";
import TransactionPool from "./wallet/transaction-pool";
import PubSub from "./pubSub";
import Wallet from "./wallet";
import isEmptyObject from "./util/isEmptyObject";
import { BlockRouter } from "./routes/block.router";

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

const options = {
  swaggerDefinition: {
    info: {
      description: "Kadocoin",
      title: "Kadocoin",
      version: "1.0.0",
    },
    host: "localhost:2000",
    basePath: "/",
    produces: ["application/json", "application/xml"],
    schemes: ["http", "https"],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "",
      },
      value: "Bearer <JWT>",
    },
  },
  basedir: __dirname, //app absolute path
  files: ["../dist/routes/*.*.js"], //Path to the API handle folder
};

const initializeRoutes = (_: Request, __: Response, next: NextFunction) => {
  new UserRouter(app, blockchain);
  new BlockRouter(app, blockchain);
  new TransactionRouter(app, transactionPool, blockchain, pubSub, localWallet);
  next();
};

const initializeMiddleWares = (
  _: Request,
  __: Response,
  next: NextFunction
) => {
  new ExpressMiddleWares(app);
  new Database(app);
  next();
};

const syncWithRootState = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);

        console.log(
          "replacing your BLOCKCHAIN with the consensus blockchain",
          rootChain
        );
        console.log("working on it.................");
        blockchain.replaceChain(rootChain);
      } else {
        console.log(`${ROOT_NODE_ADDRESS}/api/blocks`, error);
      }
    }
  );

  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);

        // CHECK EMPTY
        if (isEmptyObject(rootTransactionPoolMap))
          console.log("No new transaction coming in from the network");
        // NOT EMPTY
        if (!isEmptyObject(rootTransactionPoolMap)) {
          console.log(
            "Adding latest unconfirmed TRANSACTIONS to your node",
            rootTransactionPoolMap
          );
          console.log("working on it.................");
          transactionPool.setMap(rootTransactionPoolMap);
          console.log("Done!");
        }
      } else {
        console.log(`${ROOT_NODE_ADDRESS}/api/transaction-pool-map`, error);
      }
    }
  );
};

app.use(initializeMiddleWares);
app.use(initializeRoutes);
expressSwagger(options);
app.listen(PORT, () => {
  if (PORT !== DEFAULT_PORT) syncWithRootState();
  console.log(`Application is running on ${PORT} in ${ENVIRONMENT}`);
});
