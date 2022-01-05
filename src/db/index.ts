import EventEmitter from 'events';
import level from 'level'; // SOURCE => https://github.com/Level/level
import Block from '../blockchain/block';
import {
  balancesStorageFolder,
  blockchainStorageFolder,
  blocksIndexFolder,
  KADOCOIN_VERSION,
  lastBlockStorageFolder,
} from '../settings';
import { IChain, IValue } from '../types';
import isEmptyObject from '../util/is-empty-object';
import logger from '../util/logger';
import { getTotalSent } from '../util/transaction-metrics';
import Transaction from '../wallet/transaction';

class LevelDB {
  balancesDB: level.LevelDB<any, any>;
  eventEmitter: EventEmitter;
  blocksDB: level.LevelDB<any, any>;
  latestBlockDB: level.LevelDB<any, any>;
  blocksIndexDB: level.LevelDB<any, any>;

  constructor(eventEmitter?: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.balancesDB = level(balancesStorageFolder, { valueEncoding: 'json' }, err => {
      if (err) {
        logger.fatal('Balance DB cannot start', { err });

        // TODO: RESTART SERVER - NOT WORKING ON UBUNTU 20
        // eventEmitter.emit('restart-kdc');
      }
    });
    this.blocksDB = level(blockchainStorageFolder, { valueEncoding: 'json' }, err => {
      if (err) {
        logger.fatal('Blocks DB cannot start', { err });
      }
    });
    this.latestBlockDB = level(lastBlockStorageFolder, { valueEncoding: 'json' }, err => {
      if (err) {
        logger.fatal('Latest block DB cannot start', { err });
      }
    });
    this.blocksIndexDB = level(blocksIndexFolder, { valueEncoding: 'json' }, err => {
      if (err) {
        logger.fatal('Blocks index DB cannot start', { err });
      }
    });
  }

  public openDBs(): Promise<boolean> {
    return new Promise(resolve => {
      try {
        this.balancesDB.open(err => {
          if (!err) {
            return this.blocksDB.open(err => {
              if (!err) {
                return this.latestBlockDB.open(err => {
                  if (!err) {
                    return this.blocksIndexDB.open(err => {
                      if (!err) return resolve(true);

                      resolve(false);
                    });
                  }

                  resolve(false);
                });
              }

              resolve(false);
            });
          }

          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  public async onStartSaveGenesisBlockToDB(chain: IChain): Promise<boolean> {
    return await new Promise(async resolve =>
      this.getLocalHighestBlockchainHeight().then(localBestHeight => {
        if (localBestHeight > 1) return true;

        // SAVE BLOCKS TO DB
        this.addBlocksToDB({ blocks: chain }).then(status => {
          if (status.type == 'error') return resolve(false);

          logger.info('Genesis block saved');
          resolve(true);
        });
      })
    );
  }

  public getAllKeysAndValues(db: level.LevelDB<any, any>): void {
    db.createReadStream({ reverse: true }).on('data', (data: { key: string; value: any }) =>
      logger.info('Blocks data', { data })
    );
  }

  public async addBlocksToDB({
    blocks,
  }: {
    blocks: Block[];
  }): Promise<{ type: string; message: string }> {
    try {
      for await (const block of blocks) {
        // SAVE BLOCK AS A `HEIGHT => BLOCK` KEY-VALUE
        await this.createOrUpdate(block.blockchainHeight, block, this.blocksDB);

        // SAVE BLOCK AS `HASH => HEADERS` KEY-VALUE
        await this.createOrUpdate(
          block.hash,
          this.extractHeadersFromBlock(block),
          this.blocksIndexDB
        );
      }

      // STORES HIGHEST BLOCK HEIGHT
      await this.updateLatestBlockHeight(blocks);

      return { type: 'success', message: 'success' };
    } catch (err) {
      logger.error('Error at addBlockToDB', err);

      logger.info('Clearing the db...');

      this.clear(this.blocksDB).then(status => status.type == 'success' && logger.info('Done'));
    }
  }

  private extractHeadersFromBlock(block: Block) {
    return {
      blockchainHeight: block.blockchainHeight,
      hashOfAllHashes: block.hashOfAllHashes,
      lastHash: block.lastHash,
      nonce: block.nonce,
      timestamp: block.timestamp,
      version: KADOCOIN_VERSION,
    };
  }

  public async getLocalHighestBlockchainHeight(): Promise<number> {
    try {
      const data = await this.getValue('latest-blk-height', this.latestBlockDB);
      return isEmptyObject(data.message) ? 1 : data.message.height;
    } catch (err) {
      logger.error('Error at  getLocalHighestBlockchainHeight', err);
    }
  }

  public async getPreviousBlockByHeight(): Promise<Block> {
    try {
      // GET LATEST BLOCK BLOCK HEIGHT
      const data_latest_height = await this.getValue('latest-blk-height', this.latestBlockDB);
      const latest_height = isEmptyObject(data_latest_height.message)
        ? 1
        : data_latest_height.message.height;

      // GET THE BLOCK
      const data_prev_block = await this.getValue(`${latest_height - 1}`, this.blocksDB);

      return data_prev_block.message;
    } catch (err) {
      logger.error('Error at  getPreviousBlockByHeight', err);
    }
  }

  public updateLatestBlockHeight(blocks: Block[]): Promise<{ type: string; message: string }> {
    return new Promise((resolve, reject) => {
      this.latestBlockDB.put(
        'latest-blk-height',
        { height: blocks[blocks.length - 1].blockchainHeight },
        err => {
          if (err) return reject({ type: 'error', message: err });
          resolve({ type: 'success', message: 'success' });
        }
      );
    });
  }

  public async clear(db: level.LevelDB<any, any>): Promise<{ type: string; message: string }> {
    return new Promise((resolve, reject) => {
      db.clear(err => {
        if (err) return reject({ type: 'error', message: err });

        resolve({ type: 'success', message: 'success' });
      });
    });
  }

  public async addOrUpdateBal(blocks: Array<Block>): Promise<{ type: string; message: string }> {
    try {
      for await (const block of blocks) {
        const transactions = block['transactions'];

        for await (const transaction of transactions) {
          this.regularTxn(transaction, block).then(
            async () => await this.rewardTxn(transaction, block)
          );
        }
      }

      // UPDATE LATEST BLOCK HEIGHT
      await this.updateLatestBlockHeight(blocks);

      return { type: 'success', message: 'success' };
    } catch (error) {
      logger.error('Error at method => addOrUpdateBal', { error });
    }
  }

  private rewardTxn = async (
    transaction: Transaction,
    block: Block
  ): Promise<{ type: string; message: string }> => {
    return new Promise(async resolve => {
      if (Object.values(transaction['output']).length === 1) {
        /**
         * REWARD TRANSACTION
         */
        for (const address in transaction['output']) {
          if (Object.prototype.hasOwnProperty.call(transaction['output'], address)) {
            const newly_received_coins = transaction['output'][address];

            const result = await new Promise(
              (resolve: (value: { type: string; message: string }) => void) =>
                this.getValue(address, this.balancesDB).then(async data => {
                  // EXISTING ADDRESS
                  if (!isEmptyObject(data.message)) {
                    let { bal, totalReceived } = data.message;

                    bal = (Number(bal) + Number(newly_received_coins)).toFixed(8);
                    totalReceived = (Number(totalReceived) + Number(newly_received_coins)).toFixed(
                      8
                    );

                    const res = await this.createOrUpdate(
                      address,
                      {
                        bal,
                        height: block.blockchainHeight,
                        timestamp: block.timestamp,
                        totalSent: data.message.totalSent,
                        totalReceived,
                        txnCount: data.message.txnCount,
                      },
                      this.balancesDB
                    );

                    resolve(res);
                  } else {
                    // NON-EXISTING ADDRESS
                    const res = await this.createOrUpdate(
                      address,
                      {
                        bal: newly_received_coins,
                        height: block.blockchainHeight,
                        timestamp: block.timestamp,
                        totalSent: (0).toFixed(8),
                        totalReceived: newly_received_coins,
                        txnCount: 0,
                      },
                      this.balancesDB
                    );

                    resolve(res);
                  }
                })
            );

            resolve(result);
          }
        }
      }
    });
  };

  private regularTxn = async (
    transaction: Transaction,
    block: Block
  ): Promise<{ type: string; message: string }> => {
    return new Promise(async (resolve, reject) => {
      if (Object.values(transaction['output']).length > 1) {
        /**
         * REGULAR TRANSACTION
         */
        const newly_total_sent_coins = getTotalSent(transaction);

        Object.entries(transaction['output']).forEach(
          async ([address, newly_received_coins], index) => {
            if (index === 0) {
              /*** THIS IS THE SENDER */
              if (Number(newly_received_coins) === 0) {
                // REMOVE FROM DB IF THE SENDER HAS NO BALANCE LEFT
                this.balancesDB.del(address, err => {
                  if (err)
                    return reject({
                      type: 'error',
                      message: `fails to delete a record for address ${address}`,
                    });

                  resolve({ type: 'success', message: 'success' });
                });
              } else {
                const result = await new Promise(
                  (resolve: (value: { type: string; message: string }) => void) =>
                    this.getValue(address, this.balancesDB).then(async data => {
                      // EXISTING ADDRESS
                      if (!isEmptyObject(data.message)) {
                        let txnCount = data.message.txnCount;
                        const old_total_Sent = data.message.totalSent;

                        txnCount += 1;
                        const new_total_sent = (
                          Number(old_total_Sent) + Number(newly_total_sent_coins)
                        ).toFixed(8);

                        const res = await this.createOrUpdate(
                          address,
                          {
                            bal: newly_received_coins,
                            height: block.blockchainHeight,
                            timestamp: block.timestamp,
                            totalSent: new_total_sent,
                            totalReceived: data.message.totalReceived,
                            txnCount,
                          },
                          this.balancesDB
                        );

                        resolve(res);
                      } else {
                        // NON-EXISTING ADDRESS
                        const res = await this.createOrUpdate(
                          address,
                          {
                            bal: newly_received_coins,
                            height: block.blockchainHeight,
                            timestamp: block.timestamp,
                            totalSent: newly_total_sent_coins,
                            totalReceived: (0).toFixed(8),
                            txnCount: 1,
                          },
                          this.balancesDB
                        );

                        resolve(res);
                      }
                    })
                );

                resolve(result);
              }
            } else {
              /*** THIS IS THE RECEIVER */
              const result = await new Promise(
                (resolve: (value: { type: string; message: string }) => void) =>
                  this.getValue(address, this.balancesDB).then(async data => {
                    //  EXISTING ADDRESS
                    if (!isEmptyObject(data.message)) {
                      let { bal, totalReceived } = data.message;

                      bal = (Number(bal) + Number(newly_received_coins)).toFixed(8);
                      totalReceived = (
                        Number(totalReceived) + Number(newly_received_coins)
                      ).toFixed(8);

                      const res = await this.createOrUpdate(
                        address,
                        {
                          bal,
                          height: block.blockchainHeight,
                          timestamp: block.timestamp,
                          totalSent: data.message.totalSent,
                          totalReceived,
                          txnCount: data.message.txnCount,
                        },
                        this.balancesDB
                      );

                      resolve(res);
                    } else {
                      // NON-EXISTING ADDRESS
                      const res = await this.createOrUpdate(
                        address,
                        {
                          bal: newly_received_coins,
                          height: block.blockchainHeight,
                          timestamp: block.timestamp,
                          totalSent: (0).toFixed(8),
                          totalReceived: newly_received_coins,
                          txnCount: 0,
                        },
                        this.balancesDB
                      );

                      resolve(res);
                    }
                  })
              );

              resolve(result);
            }
          }
        );
      }
    });
  };

  public getBal = async (address: string): Promise<{ type: string; message: string }> =>
    await new Promise((resolve, reject) => {
      this.balancesDB.get(address.trim(), (err: { notFound: any }, value: IValue) => {
        if (err) {
          if (err.notFound) resolve({ type: 'success', message: (0).toFixed(8) });

          reject({ type: 'error', message: 'Error getting balance. Please try again.' });
        } else {
          resolve({ type: 'success', message: value.bal });
        }
      });
    });

  public getValue = async (
    key: string,
    db: level.LevelDB<any, any>
  ): Promise<{ type: string; message: any }> => {
    return await new Promise((resolve, reject) => {
      db.get(key.trim(), (err: { notFound: any }, value: IValue) => {
        if (err) {
          if (err.notFound) return resolve({ type: 'success', message: {} });

          reject({ type: 'error', message: 'Error getting value. Please try again.' });
        } else {
          return resolve({ type: 'success', message: value });
        }
      });
    });
  };

  public createOrUpdate = async (
    key: string | number,
    value: Record<any, any>,
    db: level.LevelDB<any, any>
  ): Promise<{ type: string; message: string }> =>
    await new Promise((resolve, reject) => {
      db.put(key, value, err => {
        if (err) reject({ type: 'error', message: 'Error saving balance. Please try again.' });

        resolve({ type: 'success', message: 'Success' });
      });
    });
}

export default LevelDB;
