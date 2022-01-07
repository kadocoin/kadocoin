/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Blockchain from '../blockchain';
import { ITMinerConstructorParams } from '../types';
import { totalFeeReward } from '../util/transaction-metrics';
import Transaction from '../wallet/transaction';
import TransactionPool from '../wallet/transaction-pool';
import LevelDB from '../db';

class TransactionMiner {
  public blockchain: Blockchain;
  public transactionPool: TransactionPool;
  public p2p: any;
  public leveldb: LevelDB;
  public address: string;
  public message?: string;

  constructor({
    blockchain,
    transactionPool,
    address,
    p2p,
    message,
    leveldb,
  }: ITMinerConstructorParams) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.p2p = p2p;
    this.address = address;
    this.message = message;
    this.leveldb = leveldb;
  }

  async mineTransactions(): Promise<string> {
    // GET THE TRANSACTION POOL'S VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();

    if (validTransactions.length) {
      const feeReward = totalFeeReward({ transactions: validTransactions });
      const bestHeight = await this.leveldb.getLocalHighestBlockchainHeight();

      // GENERATE MINER'S REWARD
      validTransactions.push(
        Transaction.rewardTransaction({
          minerPublicKey: this.address,
          ...(this.message && { message: this.message }),
          height: bestHeight,
          feeReward,
        })
      );

      // MINE BLOCK - ADD THE BLOCK TO THE BLOCKCHAIN
      const newlyMinedBlock = await this.blockchain.addBlock({ transactions: validTransactions });

      // SAVE THE TRANSACTIONS' BALANCES IN DB
      await this.leveldb.addOrUpdateBal([newlyMinedBlock]);

      // BROADCAST THE NEWLY MINED BLOCK AND PEER INFO NEEDED TO ACCOMPANY IT
      await this.p2p.sendBlockToPeers({ block: newlyMinedBlock });

      // ADD BLOCK TO DB
      await new Promise(async (resolve: (value: { type: string; message: string }) => void) =>
        resolve(await this.leveldb.addBlocksToDB({ blocks: [newlyMinedBlock] }))
      );

      // REMOVE ALL THE TRANSACTIONS ON THIS PEER THAT ARE CONTAINED IN THE NEW SENT BLOCK
      this.transactionPool.clearBlockchainTransactions({
        chain: [newlyMinedBlock],
      });

      return 'success';
    }
    return 'error';
  }
}

export default TransactionMiner;
