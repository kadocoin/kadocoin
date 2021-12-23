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
import appendToFile from '../util/appendToFile';
import { blockchainStorageFile } from '../config/constants';

class TransactionMiner {
  public blockchain: Blockchain;
  public transactionPool: TransactionPool;
  public p2p: any;
  public address: string;
  public message?: string;

  constructor({ blockchain, transactionPool, address, p2p, message }: ITMinerConstructorParams) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.p2p = p2p;
    this.address = address;
    this.message = message;
  }

  async mineTransactions(): Promise<string> {
    // GET THE TRANSACTION POOL'S VALID TRANSACTIONS
    const validTransactions = this.transactionPool.validTransactions();

    if (validTransactions.length) {
      const feeReward = totalFeeReward({ transactions: validTransactions });

      // GENERATE MINER'S REWARD
      validTransactions.push(
        Transaction.rewardTransaction({
          minerPublicKey: this.address,
          ...(this.message && { message: this.message }),
          blockchainLen: this.blockchain.chain.length,
          feeReward,
        })
      );

      // ADD A BLOCK CONSISTING OF THESE TRANSACTION TO THE BLOCK
      const newlyMinedBlock = this.blockchain.addBlock({ transactions: validTransactions });

      // BROADCAST THE NEWLY MINED BLOCK AND ANY INFO NEEDED TO ACCOMPANY IT
      await this.p2p.sendBlockToPeers({ block: newlyMinedBlock });

      // ADD BLOCK TO FILE
      appendToFile([newlyMinedBlock], blockchainStorageFile);

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
