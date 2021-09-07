import request from 'request';
import Blockchain from '../blockchain';
import { sampleBlocks } from '../config/constants';
import { ROOT_NODE_ADDRESS } from '../config/secret';
import TransactionPool from '../wallet/transaction-pool';
import appendToFile from './appendToFile';
import getLastLine from './getLastLine';
import isEmptyObject from './isEmptyObject';
import Mining_Reward from './supply_reward';

export default async function syncWithRootState({
  blockchain,
  transactionPool,
}: {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
}): Promise<void> {
  request({ url: `${ROOT_NODE_ADDRESS}/blocks` }, async (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain2 = JSON.parse(body).message;
      const rootChain = sampleBlocks;

      /** DO FILE STUFF */
      const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
      const blockchainHeightFromFile = await getLastLine();
      console.log({ blockchainHeightFromPeer, blockchainHeightFromFile });

      if (blockchainHeightFromFile > blockchainHeightFromPeer) {
        console.log('________THIS PEER IS AHEAD__________');
        // return
      }

      if (blockchainHeightFromPeer > blockchainHeightFromFile) {
        /** ADD THE MISSING BLOCKS TO LOCAL FILE */
        console.log('_______ADD THE MISSING BLOCKS TO LOCAL FILE_____');
        // WRITE TO FILE: ADD THE DIFFERENCE STARTING FROM THE LAST BLOCK IN THE FILE
        const diffBlockchain = rootChain.slice(blockchainHeightFromFile);

        // NOW WRITE LINE BY LINE
        appendToFile(diffBlockchain);
      }

      console.log('Replacing your LOCAL blockchain with the consensus blockchain');
      console.log('working on it.................');

      // TODO: SYNC FROM DISK
      blockchain.replaceChain(rootChain2);

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
}
