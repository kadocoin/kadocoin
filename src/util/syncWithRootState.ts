import request from 'request';
import Blockchain from '../blockchain';
import { blockchainStorageFile, hardCodedPeers } from '../config/constants';
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
  let has_connected_to_a_peer__blks = false;
  let has_connected_to_a_peer__txs = false;

  for (let i = 0; i < hardCodedPeers.length; i++) {
    const peer = hardCodedPeers[i];
    console.log(`Attempting to connect to ${JSON.stringify(peer.host, null, 2)}`);

    if (!has_connected_to_a_peer__blks) {
      request({ url: `http://${peer.host}:2000/blocks` }, async (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootChain = JSON.parse(body).message;
          has_connected_to_a_peer__blks = true;

          /** SAVING TO FILE STARTS */
          // FILE EXISTS
          if (fs.existsSync(blockchainStorageFile)) {
            const blockchainHeightFromPeer = rootChain[rootChain.length - 1].blockchainHeight;
            const blockchainHeightFromFile = await getLastLine(blockchainStorageFile);
            ConsoleLog(
              `blockchainHeightFromPeer: ${blockchainHeightFromPeer}, blockchainHeightFromFile: ${blockchainHeightFromFile}`
            );

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
          ConsoleLog(`MINING_REWARD: ${MINING_REWARD}, SUPPLY: ${SUPPLY}`);
        } else {
          ConsoleLog(`${peer.host}:2000/blocks - ${error}`);
        }
        ConsoleLog('============================================');
      });
    }

    if (!has_connected_to_a_peer__txs) {
      request({ url: `http://${peer.host}:2000/transaction-pool` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootTransactionPoolMap = JSON.parse(body).message;
          has_connected_to_a_peer__txs = true;

          // CHECK EMPTY
          if (isEmptyObject(rootTransactionPoolMap))
            ConsoleLog('No new transaction coming in from the network');
          // NOT EMPTY
          if (!isEmptyObject(rootTransactionPoolMap)) {
            ConsoleLog('Adding latest unconfirmed TRANSACTIONS to your node');
            ConsoleLog('working on it...');
            transactionPool.setMap(rootTransactionPoolMap);
            ConsoleLog('Done!');
          }
        } else {
          ConsoleLog(`${peer.host}:2000/transaction-pool - ${error}`);
        }
        ConsoleLog('============================================');
      });
    }

    /** SET TIME DELAY */
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (has_connected_to_a_peer__blks && has_connected_to_a_peer__txs) {
      ConsoleLog('Found a peer. Exiting...');
      break;
    }
  }
}
