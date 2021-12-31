import level from 'level'; // SOURCE => https://github.com/Level/level
import Block from '../blockchain/block';
import { balancesStorageFolder } from '../config/constants';
import { IValue } from '../types';
import isEmptyObject from '../util/is-empty-object';
import logger from '../util/logger';
import { getTotalSent } from '../util/transaction-metrics';

class LevelDB {
  balancesDB: level.LevelDB<any, any>;

  constructor() {
    this.balancesDB = level(
      balancesStorageFolder,
      { valueEncoding: 'json' },
      err => err && logger.fatal('DB error', { err })
      // TODO TRIGGER AN EVENT TO RESTART SERVER
    );
  }

  public getAllKeysAndValues(): void {
    this.balancesDB
      .createReadStream()
      .on('data', (data: { key: string; value: any }) => logger.info('BalancesDB', { data }));
  }

  // public async addOrUpdateBal(blocks: Array<Block>): Promise<void> {
  //   try {
  //     for (let i = 0; i < blocks.length; i++) {
  //       const block = blocks[i];
  //       const transactions = blocks[i]['transactions'];

  //       for (let j = 0; j < transactions.length; j++) {
  //         const transaction = transactions[j];

  //         if (Object.values(transaction['output']).length === 1) {
  //           /**
  //            * REWARD TRANSACTION
  //            */
  //           for (const address in transaction['output']) {
  //             if (Object.prototype.hasOwnProperty.call(transaction['output'], address)) {
  //               const newly_received_coins = transaction['output'][address];

  //               await new Promise(async resolve =>
  //                 resolve(
  //                   await this.updateValueOrCreateNew({
  //                     block,
  //                     address,
  //                     newlyReceivedCoins: newly_received_coins,
  //                     type: 'receiver',
  //                   })
  //                 )
  //               );
  //             }
  //           }
  //         } else {
  //           /**
  //            * REGULAR TRANSACTION
  //            */
  //           Object.entries(transaction['output']).forEach(
  //             async ([address, newly_received_coins], index) => {
  //               if (index === 0) {
  //                 /*** THIS IS THE SENDER */

  //                 if (Number(newly_received_coins) === 0) {
  //                   // REMOVE FROM DB IF THE SENDER HAS NO BALANCE LEFT
  //                   await this.balancesDB.del(address);
  //                 } else {
  //                   await new Promise(async resolve =>
  //                     resolve(
  //                       await this.updateValueOrCreateNew({
  //                         block,
  //                         address,
  //                         newlyReceivedCoins: newly_received_coins,
  //                         type: 'sender',
  //                       })
  //                     )
  //                   );
  //                 }
  //               } else {
  //                 /*** THIS IS THE RECEIVER */
  //                 await new Promise(async resolve =>
  //                   resolve(
  //                     await this.updateValueOrCreateNew({
  //                       block,
  //                       address,
  //                       newlyReceivedCoins: newly_received_coins,
  //                       type: 'receiver',
  //                     })
  //                   )
  //                 );
  //               }
  //             }
  //           );
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     logger.error('Error at method => addOrUpdateBal', { error });
  //   }
  // }
  public async addOrUpdateBal(blocks: Array<Block>): Promise<void> {
    try {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const transactions = blocks[i]['transactions'];

        for (let j = 0; j < transactions.length; j++) {
          const transaction = transactions[j];

          if (Object.values(transaction['output']).length === 1) {
            /**
             * REWARD TRANSACTION
             */
            for (const address in transaction['output']) {
              if (Object.prototype.hasOwnProperty.call(transaction['output'], address)) {
                const newly_received_coins = transaction['output'][address];

                await new Promise(resolve =>
                  this.getValue(address).then(async data => {
                    // EXISTING ADDRESS
                    if (!isEmptyObject(data.message)) {
                      let { bal, totalReceived } = data.message;

                      bal = (Number(bal) + Number(newly_received_coins)).toFixed(8);
                      totalReceived = (
                        Number(totalReceived) + Number(newly_received_coins)
                      ).toFixed(8);

                      const res = await this.putBal(address, {
                        bal,
                        height: block.blockchainHeight,
                        timestamp: block.timestamp,
                        totalSent: data.message.totalSent,
                        totalReceived,
                        txnCount: data.message.txnCount,
                      });

                      resolve(res);
                    } else {
                      // NON-EXISTING ADDRESS
                      const res = await this.putBal(address, {
                        bal: newly_received_coins,
                        height: block.blockchainHeight,
                        timestamp: block.timestamp,
                        totalSent: (0).toFixed(8),
                        totalReceived: newly_received_coins,
                        txnCount: 0,
                      });

                      resolve(res);
                    }
                  })
                );
              }
            }
          } else {
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
                    await this.balancesDB.del(address);
                  } else {
                    await new Promise(resolve =>
                      this.getValue(address).then(async data => {
                        // EXISTING ADDRESS
                        if (!isEmptyObject(data.message)) {
                          let txnCount = data.message.txnCount;
                          const old_total_Sent = data.message.totalSent;

                          txnCount += 1;
                          const new_total_sent = (
                            Number(old_total_Sent) + Number(newly_total_sent_coins)
                          ).toFixed(8);

                          const res = await this.putBal(address, {
                            bal: newly_received_coins,
                            height: block.blockchainHeight,
                            timestamp: block.timestamp,
                            totalSent: new_total_sent,
                            totalReceived: data.message.totalReceived,
                            txnCount,
                          });

                          resolve(res);
                        } else {
                          // NON-EXISTING ADDRESS
                          const res = await this.putBal(address, {
                            bal: newly_received_coins,
                            height: block.blockchainHeight,
                            timestamp: block.timestamp,
                            totalSent: newly_total_sent_coins,
                            totalReceived: (0).toFixed(8),
                            txnCount: 1,
                          });

                          resolve(res);
                        }
                      })
                    );
                  }
                } else {
                  /*** THIS IS THE RECEIVER */
                  await new Promise(resolve =>
                    this.getValue(address).then(async data => {
                      //  EXISTING ADDRESS
                      if (!isEmptyObject(data.message)) {
                        let { bal, totalReceived } = data.message;

                        bal = (Number(bal) + Number(newly_received_coins)).toFixed(8);
                        totalReceived = (
                          Number(totalReceived) + Number(newly_received_coins)
                        ).toFixed(8);

                        const res = await this.putBal(address, {
                          bal,
                          height: block.blockchainHeight,
                          timestamp: block.timestamp,
                          totalSent: data.message.totalSent,
                          totalReceived,
                          txnCount: data.message.txnCount,
                        });

                        resolve(res);
                      } else {
                        // NON-EXISTING ADDRESS
                        const res = await this.putBal(address, {
                          bal: newly_received_coins,
                          height: block.blockchainHeight,
                          timestamp: block.timestamp,
                          totalSent: (0).toFixed(8),
                          totalReceived: newly_received_coins,
                          txnCount: 0,
                        });

                        resolve(res);
                      }
                    })
                  );
                }
              }
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error at method => addOrUpdateBal', { error });
    }
  }

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

  public putBal = async (key: string, value: IValue): Promise<{ type: string; message: string }> =>
    await new Promise((resolve, reject) => {
      this.balancesDB.put(key, value, err => {
        if (err) reject({ type: 'error', message: 'Error saving balance. Please try again.' });

        resolve({ type: 'success', message: 'Success' });
      });
    });

  private async saveValueForNewAddress({
    address,
    block,
    newlyReceivedCoins,
    type,
  }: {
    address: string;
    block: Block;
    newlyReceivedCoins: string;
    type: string;
  }): Promise<{ type: string; message: string }> {
    return await new Promise((resolve: (value: { type: string; message: string }) => void) => {
      this.putBal(address, {
        bal: newlyReceivedCoins,
        height: block.blockchainHeight,
        timestamp: block.timestamp,
        totalSent: type == 'sender' ? newlyReceivedCoins : (0).toFixed(8),
        totalReceived: type == 'receiver' ? newlyReceivedCoins : (0).toFixed(8),
        txnCount: 0,
      }).then(data => resolve(data));
    });
  }
}

export default LevelDB;
