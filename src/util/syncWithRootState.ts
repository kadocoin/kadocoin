import request from 'request';
import Blockchain from '../blockchain';
import { blockchainStorageFile } from '../config/constants';
import { ROOT_NODE_ADDRESS } from '../config/secret';
import TransactionPool from '../wallet/transaction-pool';
import appendToFile from './appendToFile';
import getLastLine from './getLastLine';
import isEmptyObject from './isEmptyObject';
import Mining_Reward from './supply_reward';
import fs, { unlinkSync } from 'fs';

export default async function syncWithRootState({
  blockchain,
  transactionPool,
}: {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
}): Promise<void> {
  request({ url: `${ROOT_NODE_ADDRESS}/blocks` }, async (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const rootChain = JSON.parse(body).message;

      // FILE EXISTS
      if (fs.existsSync(blockchainStorageFile)) {
        const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
        const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
        console.log({ blockchainHeightFromPeer, blockchainHeightFromFile });

        /** THIS PEER IS AHEAD */
        if (blockchainHeightFromPeer < blockchainHeightFromFile) {
          console.log('________THIS PEER IS AHEAD________');
          try {
            unlinkSync(blockchainStorageFile);
            console.log('________FILE DELETED________');
            appendToFile(rootChain, blockchainStorageFile);
          } catch {
            console.log('________ERROR DELETING FILE________');
          }
        }

        /** THIS PEER NEEDS TO CATCH UP */
        if (blockchainHeightFromPeer > blockchainHeightFromFile) {
          /** ADD THE MISSING BLOCKS TO LOCAL FILE */
          console.log('________ADD THE MISSING BLOCKS TO LOCAL FILE________');
          // WRITE TO FILE: ADD THE DIFFERENCE STARTING FROM THE LAST BLOCK IN THE FILE
          const diffBlockchain = rootChain.slice(blockchainHeightFromFile);

          // NOW WRITE LINE BY LINE
          appendToFile(diffBlockchain, blockchainStorageFile);
        }
      } else {
        console.log('________FILE DOES NOT EXISTS________');
        appendToFile(rootChain, blockchainStorageFile);
      }

      console.log('________REPLACING YOUR LOCAL BLOCKCHAIN WITH THE CONSENSUS BLOCKCHAIN________');
      console.log('________WORKING ON IT.................________');

      // TODO: SYNC FROM DISK ?
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
}
