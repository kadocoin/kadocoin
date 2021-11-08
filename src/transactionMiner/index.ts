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
import { KADOCOIN_VERSION } from '../config/secret';
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

  mineTransactions(): string {
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
      this.p2p.broadcastNewlyMinedBlock({
        block: newlyMinedBlock,
        info: { KADOCOIN_VERSION, LOCAL_IP: 'replace_me', height: this.blockchain.chain.length },
      });

      // ADD BLOCK TO FILE
      appendToFile([newlyMinedBlock], blockchainStorageFile);

      // TODO: CLEAR THE POOL?
      this.transactionPool.clear();

      return 'success';
    }
    return 'error';
  }
}

export default TransactionMiner;
