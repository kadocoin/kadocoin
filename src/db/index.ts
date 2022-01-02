import EventEmitter from 'events';
import level from 'level'; // SOURCE => https://github.com/Level/level
import Block from '../blockchain/block';
import { balancesStorageFolder, blockchainStorageFolder } from '../settings';
import { IValue } from '../types';
import isEmptyObject from '../util/is-empty-object';
import logger from '../util/logger';
import { getTotalSent } from '../util/transaction-metrics';
import Transaction from '../wallet/transaction';

class LevelDB {
  balancesDB: level.LevelDB<any, any>;
  eventEmitter: EventEmitter;
  blocksDB: level.LevelDB<any, any>;

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
  }

  public openDBs(): Promise<boolean> {
    return new Promise(resolve => {
      try {
        this.balancesDB.open(err => {
          if (!err) {
            return this.blocksDB.open(err => {
              if (!err) return resolve(true);

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

  public getAllKeysAndValues(): void {
    this.blocksDB
      .createReadStream({ reverse: true })
      .on('data', (data: { key: string; value: any }) => logger.info('Blocks data', { data }));
  }

  public async addBlocksToDB({
    blocks,
  }: {
    blocks: Block[];
  }): Promise<{ type: string; message: string }> {
    try {
      for await (const block of blocks) {
        await this.createOrUpdate(this.decToBin(block.blockchainHeight), block, this.blocksDB);
      }

      return { type: 'success', message: 'success' };
    } catch (err) {
      logger.error('Error at addBlockToDB', err);

      logger.info('Clearing the db...');

      this.clear(this.blocksDB).then(status => status.type == 'success' && logger.info('Done'));
    }
  }

  public async getLocalHighestBlockchainHeight(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.blocksDB
        .createKeyStream({ reverse: true, limit: 1 })
        .on('data', value => {
          return resolve(this.binToDec(value));
        })
        .on('error', err => {
          reject(err);
        })
        .on('end', function () {
          // IF NO DATA PRESENT IN THE DB, 0 IS RETURNED
          resolve(0);
        });
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
                this.getValue(address).then(async data => {
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
                    this.getValue(address).then(async data => {
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
                  this.getValue(address).then(async data => {
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
    address: string
  ): Promise<{ type: string; message: IValue | Record<string, never> }> => {
    return await new Promise((resolve, reject) => {
      this.balancesDB.get(address.trim(), (err: { notFound: any }, value: IValue) => {
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
    key: string,
    value: Record<any, any>,
    db: level.LevelDB<any, any>
  ): Promise<{ type: string; message: string }> =>
    await new Promise((resolve, reject) => {
      db.put(key, value, err => {
        if (err) reject({ type: 'error', message: 'Error saving balance. Please try again.' });

        resolve({ type: 'success', message: 'Success' });
      });
    });

  private decToBin(dec: number): string {
    return (dec >>> 0).toString(2);
  }
  private binToDec(stringedBin: string): number {
    return parseInt(stringedBin, 2);
  }
}

export default LevelDB;
