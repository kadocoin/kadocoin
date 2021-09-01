import request from 'request';
import Blockchain from '../blockchain';
import { ROOT_NODE_ADDRESS } from '../config/secret';
import TransactionPool from '../wallet/transaction-pool';
import isEmptyObject from './isEmptyObject';
import Mining_Reward from './supply_reward';

const syncWithRootState = ({
  blockchain,
  transactionPool,
}: {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
}): void => {
  request({ url: `${ROOT_NODE_ADDRESS}/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body).message;

      console.log('Replacing your LOCAL blockchain with the consensus blockchain');
      console.log('working on it.................');

      // TODO: SYNC FROM DISK
      blockchain.replaceChain(rootChain);

      // UPDATE MINING_REWARD
      const { MINING_REWARD, SUPPLY } = new Mining_Reward().calc({
        chainLength: blockchain.chain.length,
      });
      console.log({ MINING_REWARD, SUPPLY });
    } else {
      console.log(`${ROOT_NODE_ADDRESS}/blocks`, error);
    }
  });

  request({ url: `${ROOT_NODE_ADDRESS}/transaction-pool` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootTransactionPoolMap = JSON.parse(body).message;

      // CHECK EMPTY
      if (isEmptyObject(rootTransactionPoolMap))
        console.log('No new transaction coming in from the network');
      // NOT EMPTY
      if (!isEmptyObject(rootTransactionPoolMap)) {
        console.log('Adding latest unconfirmed TRANSACTIONS to your node');
        console.log('working on it.................');
        transactionPool.setMap(rootTransactionPoolMap);
        console.log('Done!');
      }
    } else {
      console.log(`${ROOT_NODE_ADDRESS}/transaction-pool`, error);
    }
  });
};

export default syncWithRootState;
