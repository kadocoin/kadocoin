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
import ConsoleLog from './console-log';

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

      /** SAVING TO FILE STARTS */
      // FILE EXISTS
      if (fs.existsSync(blockchainStorageFile)) {
        const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
        const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
        console.log({ blockchainHeightFromPeer, blockchainHeightFromFile });

        /** THIS PEER IS AHEAD */
        if (blockchainHeightFromPeer < blockchainHeightFromFile) {
          try {
            ConsoleLog('THIS PEER IS AHEAD');
            // DELETE FILE
            unlinkSync(blockchainStorageFile);
            ConsoleLog('FILE DELETED');
            // REPLACE WITH BLOCKS FROM PEER
            appendToFile(rootChain, blockchainStorageFile);
          } catch {
            ConsoleLog('ERROR DELETING FILE');
          }
        }

        /** THIS PEER NEEDS TO CATCH UP */
        if (blockchainHeightFromPeer > blockchainHeightFromFile) {
          /** ADD THE MISSING BLOCKS TO LOCAL FILE */
          ConsoleLog('ADD THE MISSING BLOCKS TO LOCAL FILE');
          // WRITE TO FILE: ADD THE DIFFERENCE STARTING FROM THE LAST BLOCK IN THE FILE
          const diffBlockchain = rootChain.slice(blockchainHeightFromFile);

          // NOW WRITE LINE BY LINE
          appendToFile(diffBlockchain, blockchainStorageFile);
        }
      } else {
        ConsoleLog('FILE DOES NOT EXISTS');
        appendToFile(rootChain, blockchainStorageFile);
      }
      /** END SAVING TO FILE */

      ConsoleLog('REPLACING YOUR LOCAL BLOCKCHAIN WITH THE CONSENSUS BLOCKCHAIN');
      ConsoleLog('WORKING ON IT');

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
